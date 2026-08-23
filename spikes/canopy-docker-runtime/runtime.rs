//! Source-level Docker/runtime spike shaped for Canopy's native-capability seam.
//!
//! Intended upstream location for an experiment:
//!   src-tauri/src/runtime.rs
//!
//! This deliberately uses the user's installed `docker` CLI. The goal is to
//! validate Canopy's architecture seam, not to choose Pane's final Docker API.

use serde::{Deserialize, Serialize};
use std::process::Command;

use crate::blocking;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeContainer {
    pub id: String,
    pub name: String,
    pub image: String,
    pub state: String,
    pub status: String,
    pub ports: String,
}

fn docker(args: &[&str]) -> Result<String, String> {
    let output = Command::new("docker")
        .args(args)
        .output()
        .map_err(|err| format!("failed to launch docker: {err}"))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let suffix = if stderr.is_empty() {
            format!("exit status {}", output.status)
        } else {
            stderr
        };
        return Err(format!("docker command failed: {suffix}"));
    }

    String::from_utf8(output.stdout).map_err(|err| format!("docker returned invalid UTF-8: {err}"))
}

fn validate_container_id(id: &str) -> Result<(), String> {
    if id.is_empty() || id.len() > 128 {
        return Err("invalid container id".into());
    }

    if !id
        .bytes()
        .all(|b| b.is_ascii_alphanumeric() || matches!(b, b'_' | b'.' | b'-'))
    {
        return Err("invalid container id".into());
    }

    Ok(())
}

fn parse_container_line(line: &str) -> Result<RuntimeContainer, String> {
    let mut fields = line.splitn(6, '\t');

    let id = fields.next().unwrap_or_default().trim();
    let name = fields.next().unwrap_or_default().trim();
    let image = fields.next().unwrap_or_default().trim();
    let state = fields.next().unwrap_or_default().trim();
    let status = fields.next().unwrap_or_default().trim();
    let ports = fields.next().unwrap_or_default().trim();

    if id.is_empty() || name.is_empty() {
        return Err(format!("unexpected docker ps row: {line}"));
    }

    Ok(RuntimeContainer {
        id: id.to_string(),
        name: name.to_string(),
        image: image.to_string(),
        state: state.to_string(),
        status: status.to_string(),
        ports: ports.to_string(),
    })
}

#[tauri::command]
pub async fn runtime_list_containers() -> Result<Vec<RuntimeContainer>, String> {
    blocking::io(|| {
        let output = docker(&[
            "ps",
            "-a",
            "--format",
            "{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}\t{{.Ports}}",
        ])?;

        output
            .lines()
            .filter(|line| !line.trim().is_empty())
            .map(parse_container_line)
            .collect()
    })
}

#[tauri::command]
pub async fn runtime_stop_container(id: String) -> Result<(), String> {
    validate_container_id(&id)?;
    blocking::io(|| docker(&["stop", &id]).map(|_| ()))
}

#[tauri::command]
pub async fn runtime_restart_container(id: String) -> Result<(), String> {
    validate_container_id(&id)?;
    blocking::io(|| docker(&["restart", &id]).map(|_| ()))
}

#[tauri::command]
pub async fn runtime_container_logs(id: String, tail: Option<u16>) -> Result<String, String> {
    validate_container_id(&id)?;
    let tail = tail.unwrap_or(100).clamp(1, 500).to_string();

    blocking::io(|| docker(&["logs", "--tail", &tail, &id]))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_docker_ps_row() {
        let row = "a1b2c3\tapi\tproduct-api:dev\trunning\tUp 2 minutes (healthy)\t0.0.0.0:8080->8080/tcp";
        let parsed = parse_container_line(row).unwrap();

        assert_eq!(parsed.id, "a1b2c3");
        assert_eq!(parsed.name, "api");
        assert_eq!(parsed.image, "product-api:dev");
        assert_eq!(parsed.state, "running");
        assert!(parsed.status.contains("healthy"));
        assert!(parsed.ports.contains("8080"));
    }

    #[test]
    fn rejects_shell_metacharacters_in_resource_id() {
        assert!(validate_container_id("abc123").is_ok());
        assert!(validate_container_id("api-dev_1").is_ok());
        assert!(validate_container_id("abc;rm -rf /").is_err());
        assert!(validate_container_id("$(whoami)").is_err());
    }

    #[test]
    fn rejects_malformed_rows() {
        assert!(parse_container_line("").is_err());
        assert!(parse_container_line("only-an-id").is_err());
    }
}
