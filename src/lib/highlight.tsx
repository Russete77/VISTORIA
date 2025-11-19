import React from 'react'

/**
 * Highlight matching text in search results
 * @param text - The text to highlight
 * @param query - The search query
 * @returns React nodes with highlighted matches
 */
export function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text

  const parts = text.split(new RegExp(`(${query})`, 'gi'))

  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200 text-neutral-900 font-medium">
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  )
}
