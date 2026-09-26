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
            return `<pre class="cms-pre"><code>${code.trim()}</code></pre>`;
        });
        
        html = html.replace(/^### (.*$)/gim, '<h3 class="cms-h3">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="cms-h2">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="cms-h1">$1</h1>');
        
        html = html.replace(/^[\*\-] (.+)$/gim, '<li class="cms-li">$1</li>');
        html = html.replace(/(<li class="cms-li">.*<\/li>\n?)+/gim, '<ul class="cms-ul">$&</ul>');
        
        html = html.replace(/^\d+\. (.+)$/gim, '<li class="cms-oli">$1</li>');
        html = html.replace(/(<li class="cms-oli">.*<\/li>\n?)+/gim, '<ol class="cms-ol">$&</ol>');
        
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="cms-a" target="_blank" rel="noopener noreferrer">$1</a>');
        
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="cms-img" />');
        
        html = html.replace(/`([^`]+)`/gim, '<code class="cms-code">$1</code>');
        
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
                result.push(`<p class="cms-p">${line}</p>`);
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
            
            parts.push(<CopyableText key={`copy-${index}`} text={text} className="cms-copy" />);
            
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
                <p className="cms-p">{block.data?.text || ''}</p>
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
                <ul className="cms-ul">
                    {block.data?.items?.map((item: string, index: number) => (
                        <li key={index} className="cms-li">{item}</li>
                    ))}
                </ul>
            );

        case 'code':
            return (
                <pre className="cms-pre">
                    <code>{block.data?.code || ''}</code>
                </pre>
            );

        case 'table':
            if (!block.data?.content) return null;
            
            return (
                <div className="overflow-x-auto">
                    <table className="cms-table">
                        <tbody>
                            {block.data.content.map((row: string[], rowIndex: number) => (
                                <tr key={rowIndex}>
                                    {row.map((cell: string, cellIndex: number) => (
                                        <td 
                                            key={cellIndex} 
                                            className="cms-td"
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
                        className="cms-img"
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
        case 1: return 'cms-h1';
        case 2: return 'cms-h2';
        case 3: return 'cms-h3';
        case 4: return 'cms-h4';
        case 5: return 'cms-h4';
        case 6: return 'cms-h4';
        default: return 'cms-h2';
    }
}
