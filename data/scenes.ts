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
    ],
    reflector: {
      enabled: true,
      scale: [.0048, .0175, 0.1],
      position: [-1.15, 0.699, 1.643],
      rotation: [0.08, -3.105, 0],
      blur: [0,0],
      mixBlur: 0,
      mixStrength: 1,
      resolution: 1024,
      args: [50, 50],
      mirror: .5,
      minDepthThreshold: 0.25,
      maxDepthThreshold: 1,
      depthScale: 50,
      metalness: 0,
      roughness: 1
    }
  },
  {
    id: "2",
    title: "Lee's Room",
    location: "Seoul, South Korea",
    description: "Lee's Room is a modern and minimalist space designed for relaxation and productivity. The room features a sleek desk, a comfortable chair, and a minimalist design that allows for a peaceful work environment.",
    model: {
      component: "Alt2",
      scale: .95,
      position: [-.2, -1.3, 0],
      rotation: [0, 0, 0],
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
      scale: .85,
      position: [0, -1.05, 0],
      rotation: [0, 0, 0],
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
    ],
    reflector: {
      enabled: true,
      scale: [.057, .04, 0.1],
      position: [-2.105, 1, 0],
      rotation: [0, 1.57, 0],
      blur: [0,0],
      mixBlur: 0,
      mixStrength: 1,
      resolution: 1024,
      args: [50, 50],
      mirror: 1,
      minDepthThreshold: 0.25,
      maxDepthThreshold: 1,
      depthScale: 50,
      metalness: 0,
      roughness: 1
    }
  },
  {
    id: "4",
    title: "Joguhaus Room",
    location: "Seoul, South Korea",
    description: "Joguhaus Room is a cozy and modern space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt4",
      scale: .85,
      position: [.1, -1.2, 0],
      rotation: [0, 0, 0],
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
    ],
    reflector: {
      enabled: true,
      scale: [.06, .05, 0.1],
      position: [-2.105, 1, 0],
      rotation: [0, 1.57, 0],
      blur: [0,0],
      mixBlur: 0,
      mixStrength: 1,
      resolution: 1024,
      args: [50, 50],
      mirror: 1,
      minDepthThreshold: 0.25,
      maxDepthThreshold: 1,
      depthScale: 50,
      metalness: 0,
      roughness: 1
    }
  },
];