'use client'

import React from 'react'

// ── Inline parser: **bold**, *italic*, `code` ──────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const raw = m[0]
    if (raw.startsWith('**')) {
      nodes.push(<strong key={key++} className="font-semibold text-neutral-100">{raw.slice(2, -2)}</strong>)
    } else if (raw.startsWith('*')) {
      nodes.push(<em key={key++} className="italic text-neutral-200">{raw.slice(1, -1)}</em>)
    } else {
      nodes.push(
        <code key={key++} className="rounded bg-primary-700/60 border border-white/10 px-1 py-0.5 font-mono text-[0.78em] text-gold-300">
          {raw.slice(1, -1)}
        </code>
      )
    }
    last = m.index + raw.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// ── Block types ────────────────────────────────────────────────────────────────

type Block =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'hr' }
  | { type: 'p'; lines: string[] }

function parseBlocks(md: string): Block[] {
  const lines = md.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      i++
      blocks.push({ type: 'code', lang, code: codeLines.join('\n') })
      continue
    }

    // Headings
    const h3 = line.match(/^###\s+(.+)/)
    if (h3) { blocks.push({ type: 'h3', text: h3[1] }); i++; continue }
    const h2 = line.match(/^##\s+(.+)/)
    if (h2) { blocks.push({ type: 'h2', text: h2[1] }); i++; continue }
    const h1 = line.match(/^#\s+(.+)/)
    if (h1) { blocks.push({ type: 'h1', text: h1[1] }); i++; continue }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue }

    // Blockquote
    if (line.startsWith('>')) {
      const bqLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        bqLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'blockquote', lines: bqLines })
      continue
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Paragraph — collect consecutive non-block lines
    const pLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6}\s|>|[-*+]\s|\d+\.\s|```)/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i])
      i++
    }
    if (pLines.length) blocks.push({ type: 'p', lines: pLines })
  }

  return blocks
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  const blocks = parseBlocks(content)

  return (
    <div className={`space-y-2.5 ${className}`}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={i} className="text-base font-display font-bold text-neutral-50 leading-snug pt-1">
                {parseInline(block.text)}
              </h1>
            )
          case 'h2':
            return (
              <h2 key={i} className="text-sm font-semibold text-neutral-100 border-b border-white/10 pb-1.5 leading-snug">
                {parseInline(block.text)}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} className="text-xs font-semibold uppercase tracking-widest text-gold-400 leading-snug">
                {parseInline(block.text)}
              </h3>
            )
          case 'ul':
            return (
              <ul key={i} className="space-y-1.5 pl-0.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-neutral-300 leading-relaxed">
                    <span className="mt-[0.35rem] h-1.5 w-1.5 rounded-full bg-gold-400/70 flex-shrink-0" />
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            )
          case 'ol':
            return (
              <ol key={i} className="space-y-1.5 pl-0.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-neutral-300 leading-relaxed">
                    <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold-500/15 border border-gold-500/25 text-[10px] font-bold text-gold-400 mt-0.5">
                      {j + 1}
                    </span>
                    <span className="pt-0.5">{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            )
          case 'blockquote':
            return (
              <blockquote key={i} className="border-l-2 border-gold-500/40 pl-3.5 py-0.5 space-y-1 text-sm italic text-neutral-400">
                {block.lines.map((l, j) => <p key={j}>{parseInline(l)}</p>)}
              </blockquote>
            )
          case 'code':
            return (
              <pre key={i} className="rounded-xl bg-primary-950/80 border border-white/8 px-4 py-3 overflow-x-auto">
                <code className="font-mono text-xs text-neutral-300 whitespace-pre leading-relaxed">{block.code}</code>
              </pre>
            )
          case 'hr':
            return <hr key={i} className="border-white/10" />
          case 'p':
            return (
              <p key={i} className="text-sm text-neutral-300 leading-relaxed">
                {block.lines.flatMap((l, j) => [
                  ...(j > 0 ? [' '] : []),
                  ...parseInline(l),
                ])}
              </p>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
