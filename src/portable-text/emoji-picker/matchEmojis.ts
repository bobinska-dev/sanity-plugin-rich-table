import {EmojiMatch} from '@portabletext/plugin-emoji-picker'
import Fuse from 'fuse.js'

import {EmojiEntry} from './EmojiPicker'

// Import with assertion to satisfy Node's JSON module requirement (ERR_IMPORT_ASSERTION_TYPE_MISSING)
import emojis from 'emojilib/dist/emoji-en-US.json' with {type: 'json'}

const emojiList: EmojiEntry[] = Object.entries(emojis).map(([emoji, keywords]) => ({
  emoji,
  keywords,
}))

const fuse = new Fuse(emojiList, {
  keys: ['keywords'],
  threshold: 0.3,
  ignoreLocation: true,
})

export function matchEmojis({keyword}: {keyword: string}): EmojiMatch[] {
  if (!keyword) {
    return []
  }

  const lowerKeyword = keyword.toLowerCase()

  return fuse
    .search(keyword)
    .slice(0, 50)
    .map((result): EmojiMatch => {
      const exactKeyword = result.item.keywords.find((kw) => kw === lowerKeyword)

      if (exactKeyword) {
        return {
          type: 'exact',
          key: result.item.emoji,
          emoji: result.item.emoji,
          keyword: exactKeyword,
        }
      }

      const matchingKeyword =
        result.item.keywords.find((kw) => kw.includes(lowerKeyword)) ??
        result.item.keywords[0] ??
        ''

      return {
        type: 'partial',
        key: result.item.emoji,
        emoji: result.item.emoji,
        keyword: matchingKeyword,
        startSlice: '',
        endSlice: '',
      }
    })
}
