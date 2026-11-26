import {createElement} from 'react';
import {render} from '@testing-library/react';
import {afterEach, expect, it, vi} from 'vitest';
import {Network} from '../src/components/Network';

afterEach(()=>vi.restoreAllMocks());

it('redraws the static network after resizing with reduced motion enabled',()=>{
  const context={
    setTransform:vi.fn(),clearRect:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),
    lineTo:vi.fn(),stroke:vi.fn(),arc:vi.fn(),fill:vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const {unmount}=render(createElement(Network));
  expect(context.clearRect).toHaveBeenCalledTimes(1);
  expect(context.arc).toHaveBeenCalledTimes(42);

  window.dispatchEvent(new Event('resize'));
  expect(context.clearRect).toHaveBeenCalledTimes(2);
  expect(context.arc).toHaveBeenCalledTimes(84);

  unmount();
  window.dispatchEvent(new Event('resize'));
  expect(context.clearRect).toHaveBeenCalledTimes(2);
});
