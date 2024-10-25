import { Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';

import logo from '../assets/logo.png';
import logo2x from '../assets/logo_2x.png';
import logo4x from '../assets/logo_4x.png';

const imgSet = {
  '1x': logo,
  '2x': logo2x,
  '4x': logo4x
};

const srcSet = Object.entries(imgSet)
  .reduce((a, [dpr, img]) => [...a, `${img} ${dpr}`], [])
  .join(', ');

export default function Logo() {
  return (
    <Anchor component={Link} to="/">
      <img src={imgSet['1x']} srcSet={srcSet} height={40} alt="SnowCMS" />
    </Anchor>
  );
}
