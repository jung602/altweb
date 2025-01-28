import { SceneConfig } from '../types/scene';

export const scenesData: SceneConfig[] = [
  {
    id: "1",
    title: "Klar's Room",
    location: "Tokyo, Japan",
    description: "Klar's Room is a modern and minimalist space designed for relaxation and productivity. The room features a sleek desk, a comfortable chair, and a minimalist design that allows for a peaceful work environment.    Klar's Room is a modern and minimalist space designed for relaxation and productivity. The room features a sleek desk, a comfortable chair, and a minimalist design that allows for a peaceful work environment. Klar's Room is a modern and minimalist space designed for relaxation and productivity. The room features a sleek desk, a comfortable chair, and a minimalist design that allows for a peaceful work environment. Klar's Room is a modern and minimalist space designed for relaxation and productivity. The room features a sleek desk, a comfortable chair, and a minimalist design that allows for a peaceful work environment.",
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
        position: [4, 1.2, 5],
        intensity: 3
      }
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
    id: "2",
    title: "Lee's Room",
    location: "Seoul, South Korea",
    description: "Lee's Room is a modern and minimalist space designed for relaxation and productivity. The room features a sleek desk, a comfortable chair, and a minimalist design that allows for a peaceful work environment.",
    model: {
      component: "Alt2",
      scale: .95,
      position: [-.25, -1.2, 0],
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
    labels: [
      {
        title: "Desk",
        content: "Cohen",
        position: [1, 1, 0]
      },
      {
        title: "BTrolli",
        content: "Johnna Expensive",
        position: [0, .5, 0]
      }
    ]
  },
  {
    id: "3",
    title: "Vitra Room",
    location: "Birsfelden, Switzerland",
    description: "Vitra Room is a cozy and modern space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt3",
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
        intensity: 0
      }
    },
    labels: [
      {
        title: "Shelf",
        content: "Custom Made",
        position: [1, 1, 0]
      },
      {
        title: "Chair",
        content: "Herman Miller",
        position: [0, .5, 0]
      }
    ]
  },
];