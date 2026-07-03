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
            {toolbarSchema.styles?.map((style) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const styleButton = useStyleSelector({schemaTypes: [style]})
              return (
                <MenuItem
                  key={style.name}
                  onClick={() => styleButton.send({type: 'toggle', style: style.name})}
                  selected={currentStyle == style.name}
                  icon={style.icon}
                  as={'button'}
                  padding={2}
                  tone={'default'}
                  title={style.title}
                  role="menuitemradio"
                  aria-checked={currentStyle == style.name}
                  aria-label={style.title}
                />
              )
            })}
          </Menu>
        }
      />
    </Card>
  )
}
export default StyleSelector
