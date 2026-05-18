export interface RichTablePluginConfig {
  /** Enable experimental PortableTextCell component */
  experimentalPortableTextCell?: boolean
}

let _pluginConfig: RichTablePluginConfig = {}

export const setPluginConfig = (config: RichTablePluginConfig) => {
  _pluginConfig = config
}

export const getPluginConfig = (): RichTablePluginConfig => _pluginConfig
