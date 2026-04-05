"use client"

import { useState } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import Link from '@tiptap/extension-link'
import BulletList from '@tiptap/extension-bullet-list'
import { Button } from "@/components/ui/button"
import { Send, Bold, Italic, Strikethrough, Link as LinkIcon, Quote, List, Loader2, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isUploadsEnabled } from '@/lib/upload'
import { UploadFile } from '../upload-file'

interface TipTapEditorProps {
    onSend: (content: string) => void
    disabled: boolean
    handleFilesSelected?: (files: File[]) => void
    isScanning?: boolean
    initialContent?: string
}

export function TipTapEditor({ onSend, handleFilesSelected, disabled, isScanning, initialContent }: TipTapEditorProps) {
    const [content, setContent] = useState(initialContent || '')

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: false,
            }),
            BubbleMenuExtension,
            Link.configure({
                openOnClick: false,
            }),
            BulletList.configure({
                HTMLAttributes: {
                    class: 'list-disc list-inside',
                },
            }),
        ],
        content: initialContent || '',
        immediatelyRender: true,
        onUpdate: ({ editor }) => {
            setContent(editor.getHTML())
        },
    })

    const handleSend = () => {
        if (content.trim()) {
            onSend(content)
            setContent('')
            editor?.commands.setContent('')
        }
    }

    return (
        <div className="w-full space-y-2">
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
                    <div className="flex gap-2 rounded-md border border-border/15 bg-background shadow-sm">
                        <Button
                            variant={editor.isActive("bold") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => editor.chain().focus().toggleBold().run()}
                        >
                            <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={editor.isActive("italic") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                        >
                            <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={editor.isActive("strike") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                        >
                            <Strikethrough className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={editor.isActive("link") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => {
                                const url = window.prompt('URL')
                                if (url) {
                                    editor.chain().focus().setLink({ href: url }).run()
                                }
                            }}
                        >
                            <LinkIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={editor.isActive("blockquote") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        >
                            <Quote className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={editor.isActive("bulletList") ? "default" : "ghost"}
                            size="sm"
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </BubbleMenu>
            )}
            <div className="relative">
                <EditorContent
                    editor={editor}
                    className={cn(
                        "min-h-[350px] md:min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background",
                        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
                        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                />
                <style jsx global>{`
                    .ProseMirror {
                        min-height: 100px;
                        height: 100%;
                        outline: none;
                    }
                    .ProseMirror p.is-editor-empty:first-child::before {
                        color: #adb5bd;
                        content: attr(data-placeholder);
                        float: left;
                        height: 0;
                        pointer-events: none;
                    }

                    .tiptap a:hover {
                        text-decoration: underline;
                    }
                `}</style>
            </div>
            <div className="flex gap-4">
                {isUploadsEnabled && (
                    <UploadFile
                        className="w-fit h-11 flex-grow"
                        btnClassName="h-11"
                        onFilesSelected={handleFilesSelected}
                    />
                )}
                <Button
                    className="w-full"
                    size={"lg"}
                    onClick={handleSend}
                    disabled={disabled}
                >
                    {disabled ? (
                        isScanning ? (
                            <>
                                <Shield className="mr-2 h-4 w-4 animate-pulse text-muted-foreground" />
                                Scanning Attached Documents
                            </>
                        ) : (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Send Message
                            </>
                        )
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Message
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
