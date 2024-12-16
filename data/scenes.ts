import { SceneConfig } from '../types/scene';

export const scenesData: SceneConfig[] = [
  {
    id: 1,
    title: "Klar's Room",
    subtitle: "Tokyo, Japan",
    model: {
      component: "Alt1",
      scale: 1,
      position: [0, -1.2, 0],
      rotation: [0, 0, 0],
    },
    camera: {
      position: [5, 6.5, -10],
      fov: 160
    },
    lights: {
      directional: {
        position: [5, 10, 5],
        intensity: 10
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
    title: "Lee's Room",
    subtitle: "Seoul, South Korea",
    model: {
      component: "Alt2",
      scale: .9,
      position: [0, -1.2, 0],
      rotation: [0, 0, 0],
    },
    camera: {
      position: [5, 6.5, -10],
      fov: 160
    },
    lights: {
      directional: {
        position: [5, 10, 5],
        intensity: 10
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
];