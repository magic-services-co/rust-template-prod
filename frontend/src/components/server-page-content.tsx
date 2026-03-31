"use client";

import React from "react";
import Image from "next/image";
import { CopyableText } from "@/components/copyable-text";

interface Block {
    type: string;
    data: any;
}

interface Content {
    blocks?: Block[];
    html?: string;
}

export function ServerPageContent({ content }: { content: any }) {
    let contentString: string;
    
    if (typeof content === 'string') {
        contentString = content;
    } else if (content && typeof content === 'object') {
        if (typeof content.markdown === 'string') {
            contentString = content.markdown;
        } else if (content.content && typeof content.content === 'string') {
            contentString = content.content;
        } else {
            contentString = JSON.stringify(content);
        }
    } else {
        contentString = String(content || '');
    }

    return <MarkdownRenderer content={contentString} />;
}

function MarkdownRenderer({ content }: { content: string }) {
    const copyableTexts: string[] = [];
    const copyablePattern = /\[copy:(.+?)\]/g;
    
    let processedContent = content;
    let match;
    let matchIndex = 0;
    
    while ((match = copyablePattern.exec(content)) !== null) {
        const text = match[1];
        copyableTexts.push(text);
        processedContent = processedContent.replace(match[0], `__COPY__${matchIndex}__`);
        matchIndex++;
    }
    
    const renderMarkdown = (text: string) => {
        let html = text;
        
        html = html.replace(/```([\s\S]*?)```/gim, (match, code) => {
            return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4"><code>${code.trim()}</code></pre>`;
        });
        
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-2xl font-bold mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-3xl font-bold mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-4xl font-bold mb-4">$1</h1>');
        
        html = html.replace(/^[\*\-] (.+)$/gim, '<li class="list-disc ml-6">$1</li>');
        html = html.replace(/(<li class="list-disc ml-6">.*<\/li>\n?)+/gim, '<ul class="space-y-2 my-4">$&</ul>');
        
        html = html.replace(/^\d+\. (.+)$/gim, '<li class="list-decimal ml-6">$1</li>');
        html = html.replace(/(<li class="list-decimal ml-6">.*<\/li>\n?)+/gim, '<ol class="space-y-2 my-4">$&</ol>');
        
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noopener noreferrer">$1</a>');
        
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="w-full h-auto rounded-lg my-4" />');
        
        html = html.replace(/`([^`]+)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
        
        const lines = html.split('\n');
        let result: string[] = [];
        let inList = false;
        
        lines.forEach((line) => {
            if (line.trim().startsWith('<') || line.trim() === '') {
                result.push(line);
                if (line.includes('</ul>') || line.includes('</ol>')) {
                    inList = false;
                }
                if (line.includes('<ul') || line.includes('<ol')) {
                    inList = true;
                }
            } else if (!inList && line.trim() !== '') {
                result.push(`<p class="mb-4 leading-relaxed">${line}</p>`);
            }
        });
        
        return result.join('\n');
    };

    const renderedHtml = renderMarkdown(processedContent);
    
    if (copyableTexts.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />;
    }
    
    return <MarkdownWithCopyable html={renderedHtml} copyableTexts={copyableTexts} />;
}

function MarkdownWithCopyable({ html, copyableTexts }: { html: string; copyableTexts: string[] }) {
    const parts: (string | React.ReactElement)[] = [];
    let currentHtml = html;
    
    copyableTexts.forEach((text, index) => {
        const placeholder = `__COPY__${index}__`;
        const splitIndex = currentHtml.indexOf(placeholder);
        
        if (splitIndex !== -1) {
            const beforeHtml = currentHtml.substring(0, splitIndex);
            if (beforeHtml.trim()) {
                parts.push(<span key={`before-${index}`} dangerouslySetInnerHTML={{ __html: beforeHtml }} />);
            }
            
            parts.push(<CopyableText key={`copy-${index}`} text={text} />);
            
            currentHtml = currentHtml.substring(splitIndex + placeholder.length);
        }
    });
    
    if (currentHtml.trim()) {
        parts.push(<span key="after" dangerouslySetInnerHTML={{ __html: currentHtml }} />);
    }
    
    return <div>{parts}</div>;
}

function BlockRenderer({ block }: { block: Block }) {
    switch (block.type) {
        case 'paragraph':
            return (
                <p className="text-lg leading-relaxed">{block.data?.text || ''}</p>
            );

        case 'header':
            const level = block.data?.level || 1;
            const content = block.data?.text || '';
            
            switch (level) {
                case 1: return <h1 className={`font-bold ${getHeaderClass(1)}`}>{content}</h1>;
                case 2: return <h2 className={`font-bold ${getHeaderClass(2)}`}>{content}</h2>;
                case 3: return <h3 className={`font-bold ${getHeaderClass(3)}`}>{content}</h3>;
                case 4: return <h4 className={`font-bold ${getHeaderClass(4)}`}>{content}</h4>;
                case 5: return <h5 className={`font-bold ${getHeaderClass(5)}`}>{content}</h5>;
                case 6: return <h6 className={`font-bold ${getHeaderClass(6)}`}>{content}</h6>;
                default: return <h2 className={`font-bold ${getHeaderClass(2)}`}>{content}</h2>;
            }

        case 'list':
            return (
                <ul className="list-disc list-inside space-y-2">
                    {block.data?.items?.map((item: string, index: number) => (
                        <li key={index} className="text-lg">{item}</li>
                    ))}
                </ul>
            );

        case 'code':
            return (
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                    <code>{block.data?.code || ''}</code>
                </pre>
            );

        case 'table':
            if (!block.data?.content) return null;
            
            return (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 dark:border-slate-700">
                        <tbody>
                            {block.data.content.map((row: string[], rowIndex: number) => (
                                <tr key={rowIndex}>
                                    {row.map((cell: string, cellIndex: number) => (
                                        <td 
                                            key={cellIndex} 
                                            className="border border-slate-300 dark:border-slate-700 px-4 py-2"
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'image':
            const imageUrl = block.data?.file?.url || block.data?.url;
            return (
                <div className="w-full relative">
                    <Image
                        src={imageUrl}
                        alt={block.data?.caption || 'Image'}
                        width={1200}
                        height={800}
                        className="w-full h-auto rounded-lg"
                        unoptimized
                    />
                </div>
            );

        case 'html':
            return <div dangerouslySetInnerHTML={{ __html: block.data?.html || '' }} />;

        default:
            return <div className="text-muted-foreground italic">Unknown block type: {block.type}</div>;
    }
}

function getHeaderClass(level: number): string {
    switch (level) {
        case 1: return 'text-4xl mb-4';
        case 2: return 'text-3xl mb-3';
        case 3: return 'text-2xl mb-2';
        case 4: return 'text-xl mb-2';
        case 5: return 'text-lg mb-1';
        case 6: return 'text-base mb-1';
        default: return 'text-xl mb-2';
    }
}
