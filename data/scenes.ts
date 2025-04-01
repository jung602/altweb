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
      items: [
        {
          position: [0, 1, 1.75],
          rotation: [-Math.PI / 1, 0, 0],
          args: [1.74, 1.96],
          color: "#a0a0a0",
        },
        {
          position: [-1.15, 0.6, 1.65],
          rotation: [-Math.PI / 1.02, 0, 0],
          args: [.25, 1.11],
          clipBias: 0,
          color: "#aaaaaa"
        }
      ]
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
      position: [-.15, -1.3, 0],
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
    ],
    reflector: {
      enabled: false,
      items: []
    }
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
      items: [
        {
          position: [-2.11, 1, 0],
          rotation: [0, 1.57, 0],
          args: [2.85, 2],
          color: "#a0a0a0"
        }
      ]
    }
  },
  {
    id: "4",
    title: "Joguhaus Room",
    location: "Seoul, South Korea",
    description: "Joguhaus Room is a cozy and modern space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt4",
      scale: .82,
      position: [0, -.82, 0],
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
      items: [
        {
          position: [-1.95, 1, 0],
          rotation: [0, 1.57, 0],
          args: [3.5, 2.5],
          color: "#a0a0a0"
        },
      ]
    }
  },
  {
    id: "5",
    title: "Akki Room",
    location: "Tokyo, Japan",
    description: "Joguhaus Room is a cozy and modern space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt5",
      scale: .8,
      position: [-0.15, -.82, 0],
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
      enabled: false,
      items: [
      ]
    }
  },
  {
    id: "6",
    title: "Fabian Room",
    location: "Bern, Switzerland",
    description: "Fabian Room is a modern and minimalist space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt6",
      scale: .8,
      position: [0, -.82, 0],
      rotation: [0, 0, 0],
    },
    labels: [
      {
        title: "Desk",
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
      enabled: false,
      items: [
      ]
    }
  },
  {
    id: "7",
    title: "TGC Room",
    location: "Seoul, South Korea",
    description: "Fabian Room is a modern and minimalist space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt7",
      scale: .9,
      position: [0, -.95, 0],
      rotation: [0, 0, 0],
    },
    labels: [
      {
        title: "Desk",
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
      items: [
        {
          position: [-2.41, 1.64, -0.01],
          rotation: [0, 1.57, 0],
          args: [1.73, 1.43],
          color: "#a0a0a0",
          clipBias: 0
        },
      ]
    }
  },
  {
    id: "8",
    title: "Smnstr Room",
    location: "Darmstadt, Germany",
    description: "Fabian Room is a modern and minimalist space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt8",
      scale: .8,
      position: [.1, -.82, 0],
      rotation: [0, 0, 0],
    },
    labels: [
      {
        title: "Desk",
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
      enabled: false,
      items: [
        {
          position: [1.5, .81, .93],
          rotation: [-Math.PI / -2, -1.66, 0],
          args: [1.57, .977],
          color: "#eeeeee",
        },
      ]
    }
  },
  {
    id: "9",
    title: "Rareraw Room",
    location: "Seoul, South Korea",
    description: "Fabian Room is a modern and minimalist space that combines functionality with style. The room showcases a perfect balance between work and relaxation areas, featuring contemporary furniture and smart storage solutions.",
    model: {
      component: "Alt9",
      scale: .9,
      position: [-.15, -.82, 0],
      rotation: [0, 0, 0],
    },
    labels: [
      {
        title: "Desk",
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
      enabled: false,
      items: [
      ]
    }
  },
];