import App from './App.svelte';
import { check_coockie } from "./user";

check_coockie();

const app = new App({
	target: document.body
});

export default app;