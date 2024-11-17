import { SceneConfig } from '../types/scene';

export const scenesData: SceneConfig[] = [
  {
    id: 1,
    title: "CHAPTER 01",
    subtitle: "THE PROPHECY",
    author: "LUCAS FRATI",
    model: {
      component: "Alt1",
      scale: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
    },
    camera: {
      position: [0, 6.5, 10],
      fov: 30
    },
    lights: {
      directional: {
        position: [0, 10, 0],
        intensity: 1
      }
    },
    background: {
      color: '#000000'
    },
    shadowPlane: {
      position: [0, -1.01, 0],
      opacity: 0.7
    },
    environment: {
      preset: 'none'
    }
  },
  {
    id: 2,
    title: "CHAPTER 02",
    subtitle: "THE Candy",
    author: "LUCAS FRATI",
    model: {
      component: "Alt2",
      scale: 1,
      position: [0, -1, 0],
      rotation: [0, 0, 0],
    },
    camera: {
      position: [0, 5, 10],
      fov: 30
    },
    lights: {
      directional: {
        position: [5, 10, 5],
        intensity: 0
      }
    },
    background: {
      color: '#000000'
    },
    shadowPlane: {
      position: [0, -1.5, 0],
      opacity: 0
    },
    environment: {
      preset: 'none'
    }
  },
];