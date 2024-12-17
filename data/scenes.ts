import { SceneConfig } from '../types/scene';

export const scenesData: SceneConfig[] = [
  {
    id: 1,
    title: "Klar's Room",
    location: "Tokyo, Japan",
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
    environment: {
      preset: 'none'
    },
    labels: [
      {
        title: "Bed",
        content: "Ikea",
        position: [-1, .6, .1]
      },
      {
        title: "Stool",
        content: "Ikea",
        position: [-.5, .4, 1.3]
      }
    ]
  },
  {
    id: 2,
    title: "Lee's Room",
    location: "Seoul, South Korea",
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
    environment: {
      preset: 'none'
    },
    labels: [
      {
        title: "작업 공간",
        content: "주문제작 책상",
<<<<<<< HEAD
        position: [0, 1, 0]
=======
        position: [-2, 2, -2]
>>>>>>> df60bbdc90872660c28f94acaf6997ce25ba8e47
      },
      {
        title: "침대",
        content: "퀸 사이즈",
<<<<<<< HEAD
        position: [0, 0, ]
=======
        position: [-2, 0, -2]
>>>>>>> df60bbdc90872660c28f94acaf6997ce25ba8e47
      }
    ]
  },
  
];