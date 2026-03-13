import * as Mdi from '@mdi/js'
import nunjucks from 'nunjucks'
import { urlencode } from 'nunjucks/src/filters.js'

const WIDTH = 288
const HEIGHT = 288
const FONT_SIZE = 48

export class SvgUtils {
  renderButtonSVG(renderingConfig, stateObject) {
    const labels = this.renderTemplates(renderingConfig.labelTemplates, {
      ...stateObject.attributes,
      state: stateObject.state
    })
    return this.#generateButtonSVG(
      labels,
      renderingConfig.icon,
      renderingConfig.color,
      renderingConfig.isAction,
      renderingConfig.isMultiAction,
      renderingConfig.iconLayout ?? 'STANDARD'
    )
  }

  renderIconSVG(mdiIconName, iconColor) {
    const path = this.#getMdiPath(mdiIconName)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 24 24">${path ? `<path d="${path}" fill="${iconColor ?? '#FFF'}"/>` : ''}</svg>`
  }

  renderTemplates(templates, values) {
    return templates?.map((template) => nunjucks.renderString(template ?? '', values)) ?? []
  }

  #generateButtonSVG(
    labels,
    mdiIconName,
    iconColor,
    isAction = false,
    isMultiAction = false,
    iconLayout = 'STANDARD'
  ) {
    const iconPath = this.#getMdiPath(mdiIconName)

    let iconTransform, maxLines, labelIndexOffset
    if (iconLayout === 'FULL') {
      iconTransform = `translate(0, 0) scale(12)`
      maxLines = 4
      labelIndexOffset = 0
    } else if (iconLayout === 'BOTTOM') {
      iconTransform = `translate(72, 144) scale(6)`
      maxLines = 2
      labelIndexOffset = 0
    } else {
      iconTransform = `translate(72, 0) scale(6)`
      maxLines = 2
      labelIndexOffset = 2
    }

    const iconSvg = iconPath
      ? `<g transform="${iconTransform}"><path d="${iconPath}" fill="${iconColor ?? '#FFF'}"/></g>`
      : ''

    const indicatorColor = isMultiAction ? '#3e89ff' : '#62ff65'
    const indicator = isAction
      ? `<circle cx="${WIDTH - 1}" cy="0" r="30" fill="${indicatorColor}"/>`
      : ''

    const quarterOfArea = HEIGHT / 4
    let flatLabels = labels.flatMap((label) => label.split('\n'))
    if (maxLines === 2) {
      while (flatLabels.length > 0 && flatLabels[0].trim() === '') {
        flatLabels.shift()
      }
    }
    const textStroke =
      iconLayout === 'FULL'
        ? ' stroke="#000" stroke-width="6" stroke-linejoin="round" paint-order="stroke fill"'
        : ''

    const textLines = flatLabels
      .slice(0, maxLines)
      .map((line, i) => {
        const y = quarterOfArea - (quarterOfArea * 1.2 - FONT_SIZE) / 2 + (i + labelIndexOffset) * quarterOfArea
        return `<text x="${WIDTH / 2}" y="${y}" fill="#FFF" font-family="sans-serif" font-weight="bold" font-size="${FONT_SIZE}px" text-anchor="middle"${textStroke}>${this.#escapeXml(line)}</text>`
      })

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">${iconSvg}${indicator}${textLines.join('')}</svg>`
  }

  #getMdiPath(mdiIconName) {
    if (!mdiIconName) return null
    return Mdi[this.#toPascalCase(mdiIconName)] ?? null
  }

  #toPascalCase(iconName) {
    return (
      'mdi' + iconName.substring(4).replace(/(^\w|-\w)/g, (s) => s.replace(/-/, '').toUpperCase())
    )
  }

  #escapeXml(text) {
    return urlencode(text)
  }
}
