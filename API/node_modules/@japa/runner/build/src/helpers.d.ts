import { Colors } from '@poppinss/colors/types';
import { Runner, Test } from '../modules/core/main.js';
export declare const colors: Colors;
/**
 * A collection of platform specific icons
 */
export declare const icons: {
    tick: string;
    cross: string;
    bullet: string;
    nodejs: string;
    pointer: string;
    info: string;
    warning: string;
    branch: string;
    squareSmallFilled: string;
};
/**
 * Returns a formatted string to print the information about
 * a pinned test
 */
export declare function formatPinnedTest(test: Test): string;
/**
 * Prints a summary of all the pinned tests
 */
export declare function printPinnedTests(runner: Runner): void;
