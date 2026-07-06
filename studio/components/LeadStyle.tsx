import {Box, Text} from '@sanity/ui'
import type {ComponentType} from 'react'
import type {BlockStyleProps} from 'sanity'

/**
 * Custom render component for the `lead` block style — wired onto the style in
 * `customPT` via Sanity's native `{value: 'lead', component: LeadStyle}`. It's a
 * standard Sanity block-style component (`BlockStyleProps`); the plugin adapts
 * its editor to this shape. A style is block-level, so it renders a `Box` and
 * must render `props.children` to keep the text editable.
 */
const LeadStyle: ComponentType<BlockStyleProps> = (props) => (
  <Box
    paddingY={2}
    paddingLeft={3}
    style={{borderLeft: '3px solid var(--card-focus-ring-color)'}}
    data-style="lead"
  >
    <Text size={2} muted style={{fontStyle: 'italic', lineHeight: 1.6}}>
      {props.children}
    </Text>
  </Box>
)

export default LeadStyle
