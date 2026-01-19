import { Fragment, useRef, useState } from 'react'
import {
  animateGridItems,
  animateTransition,
  computeStaggerDelays,
  config,
  extractItemConfigOverrides,
  extractItemData,
  positionPanelBasedOnClick,
  resetView,
} from './config'
import './base.css'
import { randomPick } from '@/utils/imageData'

const galleries = [
  {
    title: '红',
    label: '喜庆的红色',
    images: randomPick('webp', 'high', 16, 'v', 'theme1').map(i => ({
      url: i,
      title: 'title',
      label: 'label',
    })),
  },
  {
    title: '蓝',
    label: '赛里木的蓝',
    images: randomPick('webp', 'high', 16, 'v', 'theme2').map(i => ({
      url: i,
      title: 'title',
      label: 'label',
    })),
  },
]

export default function RepeatingImageTransition() {
  const [currentItem, setCurrentItem] = useState<HTMLElement | null>(null)
  const [panelContent, setPanelContent] = useState({
    imgURL: '',
    title: '',
    desc: '',
  })
  const panel = useRef<HTMLDivElement>(null)

  const onGridItemClick = (item: HTMLElement) => {
    setCurrentItem(item)

    const overrides = extractItemConfigOverrides(item)
    Object.assign(config, overrides)

    // Position the panel, with updated config
    positionPanelBasedOnClick(panel.current!, item)

    const { imgURL, title, desc } = extractItemData(item)
    setPanelContent({ imgURL, title: title!, desc: desc! })

    const allItems = document.querySelectorAll('.grid__item')
    const delays = computeStaggerDelays(
      item,
      allItems as NodeListOf<HTMLElement>,
    )
    animateGridItems(allItems as NodeListOf<HTMLElement>, item, delays)
    animateTransition(
      item.querySelector('.grid__item-image') as HTMLElement,
      panel.current?.querySelector('.panel__img') as HTMLElement,
      imgURL,
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto">
      {galleries.map((gallery, index) => (
        <Fragment key={index}>
          <div className="heading">
            <h2 className="heading__title">{gallery.title}</h2>
            <span className="heading__meta">{gallery.label}</span>
          </div>
          <div className="grid">
            {gallery.images.map((image, index) => (
              <figure
                className="grid__item"
                role="img"
                aria-labelledby={`caption${index}`}
                key={index}
                onClick={e => onGridItemClick(e.currentTarget as HTMLElement)}
              >
                <div
                  className="grid__item-image"
                  style={{ backgroundImage: `url(${image.url})` }}
                >
                </div>
                <figcaption
                  className="grid__item-caption"
                  id={`caption${index}`}
                >
                  <h3>{image.title}</h3>
                  <p>{image.label}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Fragment>
      ))}

      <figure
        className="panel"
        role="img"
        aria-labelledby="caption"
        ref={panel}
      >
        <div
          className="panel__img"
          style={{ backgroundImage: panelContent.imgURL }}
        >
        </div>
        <figcaption className="panel__content" id="caption">
          <h3>{panelContent.title}</h3>
          <p>{panelContent.desc}</p>
          <button
            type="button"
            className="panel__close"
            aria-label="Close preview"
            onClick={() => resetView(currentItem!)}
          >
            Close
          </button>
        </figcaption>
      </figure>
    </div>
  )
}
