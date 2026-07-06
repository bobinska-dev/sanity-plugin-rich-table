import {Box, Text} from '@sanity/ui'
import {
  TbAbc,
  TbBold,
  TbCode,
  TbCodePlus,
  TbForms,
  TbH1,
  TbH2,
  TbH3,
  TbH4,
  TbH5,
  TbH6,
  TbItalic,
  TbList,
  TbListNumbers,
  TbMoodSmileBeam,
  TbPhoto,
  TbQuote,
  TbSquarePlus,
  TbStrikethrough,
  TbUnderline,
} from 'react-icons/tb'
// ICONS FOR PORTABLE TEXT EDITOR IN RICH TABLE

export const TextIcon = () => (
  <Box padding={1}>
    <Text size={0}>Aa</Text>
  </Box>
) //  <TbTextSize />
export const H1Icon = () => <TbH1 />
export const H2Icon = () => <TbH2 />
export const H3Icon = () => <TbH3 />
export const H4Icon = () => <TbH4 />
export const H5Icon = () => <TbH5 />
export const H6Icon = () => <TbH6 />

export const QuoteIcon = () => <TbQuote />
export const ListIcon = () => <TbList />
export const ListOrderedIcon = () => <TbListNumbers />

export const ImageIcon = () => <TbPhoto />

export const BoldIcon = () => <TbBold />
export const ItalicIcon = () => <TbItalic />
export const UnderlineIcon = () => <TbUnderline />
export const StrikethroughIcon = () => <TbStrikethrough />
export const CodeIcon = () => <TbCode />
export const CodeBlockIcon = () => <TbCodePlus />

export const EmojiIcon = () => <TbMoodSmileBeam />

// Generic fallbacks for schema-driven slash commands (used when a style /
// decorator / object has no dedicated icon above).
export const DecoratorIcon = () => <TbAbc />
export const BlockObjectIcon = () => <TbSquarePlus />
export const InlineObjectIcon = () => <TbForms />
