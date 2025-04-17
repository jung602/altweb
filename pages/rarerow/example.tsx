import Scene3D from '../../components/Scene3D'
import Head from 'next/head'

const Product1Page = () => {
  return (
    <>
      <Head>
        <title>Product 1 - Rarerow</title>
      </Head>
      <Scene3D />
    </>
  )
}

// 정적 생성 방식 선택
export const getStaticProps = async () => {
  return {
    props: {},
  }
}

export default Product1Page 