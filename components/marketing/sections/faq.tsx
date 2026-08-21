'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeading } from '@/components/marketing/section-heading'
import { Reveal } from '@/components/marketing/reveal'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: 'What is Advoka?',
    a: 'Advoka is an AI case intelligence platform for lawyers. It turns complex case documents into a structured overview so you can find the facts, contradictions, missing evidence and deadlines that matter.',
  },
  {
    q: 'How does Advoka analyze case documents?',
    a: 'You upload the documents for a case, and Advoka processes the available information to surface key facts, an AI case summary, a timeline of events and the relationships between people, documents and evidence.',
  },
  {
    q: 'Can Advoka identify contradictions?',
    a: 'Advoka can surface potential contradictions — for example conflicting delivery dates or quantities across statements — and flags them for closer review. It highlights where evidence disagrees rather than deciding who is right.',
  },
  {
    q: 'Can I ask questions about my case?',
    a: 'Yes. You can ask questions in plain language and receive answers grounded in the documents you uploaded, with references back to the specific source and page.',
  },
  {
    q: 'Can Advoka create drafts?',
    a: 'Advoka can help you create first drafts such as legal notices, client emails and case summaries. Every draft is clearly marked as AI generated and intended for your review.',
  },
  {
    q: 'Does Advoka replace a lawyer?',
    a: 'No. Advoka is built to support the work of lawyers, not to replace it. It helps you investigate a case faster, but professional judgment and review remain with you.',
  },
  {
    q: 'How should AI generated information be reviewed?',
    a: 'Treat Advoka output as a starting point. Because every insight links back to its source, you can verify it against the original evidence before relying on it in your work.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="border-t border-border/70 bg-surface/30">
      <div className="mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-28">
        <SectionHeading eyebrow="FAQ" title="Questions, answered." />

        <div className="mt-12 divide-y divide-border border-y border-border">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <Reveal key={item.q} delay={i * 40} variant="up-sm">
                <div className="group">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors duration-200"
                    >
                      <span className="text-[15px] font-medium text-foreground transition-colors duration-200 group-hover:text-accent-ai sm:text-base">
                        {item.q}
                      </span>
                      <Plus
                        className={cn(
                          'h-4 w-4 shrink-0 text-accent-ai transition-transform duration-300 ease-out',
                          isOpen && 'rotate-45',
                        )}
                      />
                    </button>
                  </h3>
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out',
                      isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{item.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
