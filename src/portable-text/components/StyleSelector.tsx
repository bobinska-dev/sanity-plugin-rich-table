import {ToolbarSchema, useStyleSelector} from '@portabletext/toolbar'
import {ChevronDownIcon} from '@sanity/icons'
import {Button, Card, Menu, MenuButton, MenuItem} from '@sanity/ui'
import {ComponentType} from 'react'

const StyleSelector: ComponentType<{toolbarSchema: ToolbarSchema}> = ({toolbarSchema}) => {
  const styleSelector = useStyleSelector({schemaTypes: toolbarSchema.styles || []})

  const currentStyle = styleSelector.snapshot.context?.activeStyle

  const styleDropdownTitle = currentStyle
    ? toolbarSchema.styles?.find((style) => style.name === currentStyle)?.title
    : 'Aa'

  return (
    <Card borderRight>
      <MenuButton
        button={
          <Button
            text={styleDropdownTitle}
            disabled={styleSelector.snapshot.matches('disabled')}
            fontSize={1}
            padding={2}
            mode={'bleed'}
            iconRight={<ChevronDownIcon />}
            tone={'default'}
            tabIndex={-1}
            aria-label={`Text style, current style: ${styleDropdownTitle}`}
            aria-haspopup="menu"
            aria-controls={'style-selection'}
          />
        }
        id="style-selection"
        popover={{portal: true}}
        menu={
          <Menu>
            {toolbarSchema.styles?.map((style) => (
              <MenuItem
                key={style.name}
                onClick={() => styleSelector.send({type: 'toggle', style: style.name})}
                selected={currentStyle == style.name}
                icon={style.icon}
                // Show the style title as the label — a custom style without an
                // icon (e.g. one whose icon wasn't set) would otherwise render as
                // a blank, invisible menu item.
                text={style.title}
                as={'button'}
                padding={2}
                tone={'default'}
                title={style.title}
                role="menuitemradio"
                aria-checked={currentStyle == style.name}
                aria-label={style.title}
              />
            ))}
          </Menu>
        }
      />
    </Card>
  )
}
export default StyleSelector
