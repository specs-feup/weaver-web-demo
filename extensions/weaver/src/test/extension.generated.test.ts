import * as vscode from 'vscode';
import { join } from 'path';
import * as path from 'path';
import { activate, deactivate } from '../extension';

jest.mock('vscode');
jest.mock('path');
jest.mock('path');

describe('activate', () => {
  it('should expose a function', () => {
		expect(activate).toBeDefined();
	});
  
  it('activate should return expected output', () => {
    // const retValue = activate(context);
    expect(false).toBeTruthy();
  });
});
describe('deactivate', () => {
  it('should expose a function', () => {
		expect(deactivate).toBeDefined();
	});
  
  it('deactivate should return expected output', () => {
    // const retValue = deactivate();
    expect(false).toBeTruthy();
  });
});