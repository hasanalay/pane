import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import './monacoEnvironment';
import { languageForPath } from './language';

interface CodeEditorProps {
  relativePath: string;
  initialValue: string;
  onContentChange(value: string): void;
  onSave(value: string): void | Promise<void>;
}

export function CodeEditor({
  relativePath,
  initialValue,
  onContentChange,
  onSave,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const changeRef = useRef(onContentChange);
  const saveRef = useRef(onSave);

  changeRef.current = onContentChange;
  saveRef.current = onSave;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const modelUri = monaco.Uri.parse(`inmemory://pane/${encodeURIComponent(relativePath)}`);
    monaco.editor.getModel(modelUri)?.dispose();

    const model = monaco.editor.createModel(
      initialValue,
      languageForPath(relativePath),
      modelUri,
    );

    const editor = monaco.editor.create(container, {
      model,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 13,
      lineHeight: 20,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      wordWrap: 'off',
      renderWhitespace: 'selection',
      padding: { top: 12, bottom: 12 },
      tabSize: 2,
    });

    const contentSubscription = editor.onDidChangeModelContent(() => {
      changeRef.current(editor.getValue());
    });

    const saveAction = editor.addAction({
      id: 'pane.save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: async (instance) => {
        await saveRef.current(instance.getValue());
      },
    });

    editor.focus();

    return () => {
      contentSubscription.dispose();
      saveAction.dispose();
      editor.dispose();
      model.dispose();
    };
  }, [relativePath]);

  return <div className="code-editor" ref={containerRef} />;
}
