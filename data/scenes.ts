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
      position: [0, 0, 0]
    },
    camera: {
      position: [0, 6.5, 10],
      fov: 45
    },
    lights: {
      directional: {
        position: [0, 10, 0],
        intensity: 1
      }
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
      position: [0, 0, 0]
    },
    camera: {
      position: [0, 6.5, 10],
      fov: 45
    },
    lights: {
      directional: {
        position: [0, 10, 0],
        intensity: 1
      }
    }
  },
];