#!/usr/bin/env ts-node
import 'reflect-metadata';
declare function setupPermissions(): Promise<void>;
declare function listPermissions(): Promise<void>;
export { setupPermissions, listPermissions };
