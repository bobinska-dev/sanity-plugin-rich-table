import type {JSX} from 'react'

import {
  H1Icon,
  H2Icon,
  H3Icon,
  H4Icon,
  H5Icon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  TextIcon,
} from '../icons'

export type CommandMatch = {
  key: string
  label: string
  description: string
  icon: JSX.Element
  keywords: string[]
  action:
    | {type: 'insert.block'; block: {_type: string}}
    | {type: 'style.toggle'; style: string}
    | {type: 'list item.toggle'; listItem: string}
}

export const slashCommands: CommandMatch[] = [
  {
    key: 'normal',
    label: 'Normal Text',
    description: 'Standard paragraph text',
    icon: <TextIcon />,
    keywords: ['normal', 'paragraph', 'text'],
    action: {type: 'style.toggle', style: 'normal'},
  },
  {
    key: 'h1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: <H1Icon />,
    keywords: ['h1', 'heading', 'title'],
    action: {type: 'style.toggle', style: 'h1'},
  },
  {
    key: 'h2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: <H2Icon />,
    keywords: ['h2', 'heading'],
    action: {type: 'style.toggle', style: 'h2'},
  },
  {
    key: 'h3',
    label: 'Heading 3',
    description: 'Small section heading',
    icon: <H3Icon />,
    keywords: ['h3', 'heading'],
    action: {type: 'style.toggle', style: 'h3'},
  },
  {
    key: 'h4',
    label: 'Heading 4',
    description: 'Small section heading',
    icon: <H4Icon />,
    keywords: ['h4', 'heading'],
    action: {type: 'style.toggle', style: 'h4'},
  },
  {
    key: 'h5',
    label: 'Heading 5',
    description: 'Small section heading',
    icon: <H5Icon />,
    keywords: ['h5', 'heading'],
    action: {type: 'style.toggle', style: 'h5'},
  },
  {
    key: 'quote',
    label: 'Quote',
    description: 'Blockquote',
    icon: <QuoteIcon />,
    keywords: ['quote', 'blockquote'],
    action: {type: 'style.toggle', style: 'blockquote'},
  },
  {
    key: 'bullet',
    label: 'Bullet List',
    description: 'Unordered list',
    icon: <ListIcon />,
    keywords: ['bullet', 'ul', 'list', 'unordered'],
    action: {type: 'list item.toggle', listItem: 'bullet'},
  },
  {
    key: 'number',
    label: 'Numbered List',
    description: 'Ordered list',
    icon: <ListOrderedIcon />,
    keywords: ['number', 'ol', 'list', 'ordered'],
    action: {type: 'list item.toggle', listItem: 'number'},
  },
  /*  {
    key: 'image',
    label: 'Image',
    description: 'Insert an image block',
    icon: <ImageIcon />,
    keywords: ['image', 'img', 'picture'],
    action: {
      type: 'insert.block',
      block: { _type: 'image' },
    },
  },*/
  // TODO ADD MORE COMMANDS FOR RICH TABLE PORTABLE TEXT
]
