'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Editor, { Monaco } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { memo, useRef } from 'react';

interface FileEditorDialogProps {
    open: boolean;
    fileName: string | null;
    filePath: string | null;
    isBinary: boolean;
    loading: boolean;
    saving: boolean;
    content: string;
    onClose: () => void;
    onChange: (value: string) => void;
    onSave: () => void;
}

const FileEditorDialogComponent = ({
    open,
    fileName,
    filePath,
    isBinary,
    loading,
    saving,
    content,
    onClose,
    onChange,
    onSave,
}: FileEditorDialogProps) => {
    const t = useTranslations('gameserver.fileManager.editor');
    const title = fileName ?? t('dialogTitle');
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const { theme } = useTheme();
    const extension = fileName?.split('.').pop() ?? '';
    const language = extensionToLanguage[extension] ?? 'plaintext';

    function handleEditorDidMount(editor: editor.IStandaloneCodeEditor, _monaco: Monaco) {
        editorRef.current = editor;
    }

    function handleSave() {
        const value = editorRef.current?.getValue();
        onChange(value ?? ''); // ist nicht schnell genug wegen React async
        onSave();
    }

    function handleClear() {
        editorRef.current?.setValue('');
    }

    function handleFormat() {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    }

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="h-[95vh] w-full max-w-3xl overflow-hidden p-0 sm:p-0 gap-0">
                <DialogHeader className="space-y-0 border-b px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <DialogTitle className="truncate text-lg font-semibold">
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription>
                        {isBinary ? t('dialogDescriptionBinary') : t('dialogDescriptionEditable')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col flex-1 min-h-0">
                    {loading ? (
                        <div className="flex h-70 items-center justify-center text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('loadingText')}
                        </div>
                    ) : isBinary ? (
                        <div className="space-y-4 text-sm text-muted-foreground">
                            <p>{t('binaryFileWarning')}</p>
                            <p>{t('binaryFileDownload')}</p>
                        </div>
                    ) : (
                        <Editor
                            className="w-full h-full min-h-0"
                            theme={theme === 'dark' ? 'vs-dark' : 'light'}
                            defaultLanguage={language}
                            defaultValue={content}
                            onMount={handleEditorDidMount}
                            onChange={(value) => {
                                onChange(value ?? '');
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                roundedSelection: false,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                wordWrap: 'on',
                                scrollbar: { vertical: 'auto' },
                            }}
                        />
                    )}
                </div>
                <DialogFooter className="border-t bg-muted/30 px-6 py-4">
                    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:gap-4">
                        <Button variant="ghost" onClick={onClose} disabled={saving}>
                            {t('cancelButton')}
                        </Button>
                        <Button onClick={handleSave} disabled={saving || loading || isBinary}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t('saveButton')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export const FileEditorDialog = memo(FileEditorDialogComponent);

const extensionToLanguage: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
    py: 'python',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    cfg: 'ini',
    conf: 'ini',
    properties: 'ini',
    env: 'dotenv',
};
