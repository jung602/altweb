import { Html } from '@react-three/drei'
import React, { useState, useEffect } from 'react'
import { useSceneStore } from '../../store/sceneStore'

interface LabelProps {
  title: string
  content: string
  position: [number, number, number]
}

const Label = ({ title, content, position }: LabelProps) => {
  const isLabelsVisible = useSceneStore((state) => state.isLabelsVisible)
  const areLabelsOpen = useSceneStore((state) => state.areLabelsOpen)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(areLabelsOpen)
  }, [areLabelsOpen])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  if (!isLabelsVisible) return null

  return (
    <Html
      position={position}
      center
      as='div'
      className="pointer-events-auto select-none"
      occlude
      prepend
      zIndexRange={[100000, 0]}
      sprite
    >
      <div 
        data-label="true"
        className={`
          transition-all duration-300 ease-in-out flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur cursor-pointer shadow-md
          ${isOpen 
            ? 'w-auto h-auto rounded p-1' 
            : 'w-4 h-4 p-0 rounded'
          }
        `}
        onClick={handleClick}
      >
          <div className={`transition-all ease-in-out duration-800 text-xs font-geist-sans text-slate-800 whitespace-nowrap bg-slate-100 shadow-[0px_4px_10px_rgba(0,0,0,0.1)]
            ${isOpen 
            ? 'p-2 rounded' 
            : 'w-2 h-2 p-0 rounded-full'}`}>
            <p className={`${isOpen ? 'opacity-1' : 'opacity-0'}`}>{title}</p>
            <p className={`text-slate-800/70 mt-0.5 ${isOpen ? 'opacity-1' : 'opacity-0'}`}>{content}</p>
          </div>
      </div>
    </Html>
  )
}

export default Label