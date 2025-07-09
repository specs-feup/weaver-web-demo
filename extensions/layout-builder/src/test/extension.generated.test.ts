import * as vscode from 'vscode';
import { activate, deactivate } from '../extension';

jest.mock('vscode');

describe('activate', () => {
  it('should expose a function', () => {
		expect(activate).toBeDefined();
	});
  
  it('activate should return expected output', async () => {
    // const retValue = await activate(context);
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