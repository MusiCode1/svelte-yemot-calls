import { writable } from "svelte/store"
import Yemot_api from "yemot-api"

export const user_store = writable({
	is_login: false,
	user: "", pass: ""
});

export let yemot_api = new Yemot_api();

export function login(user, pass) {

	yemot_api = new Yemot_api(user, pass);
};

export function check_coockie() {

	if (document.cookie) {
		const cookie = JSON.parse(document.cookie);

		if (cookie.user && cookie.pass)
			login(cookie.user, cookie.pass)
	}
}

user_store.subscribe((value) => {

	if (value.is_login) {
		const json = JSON.stringify({
			user: value.user,
			pass: value.pass,
		});

		document.cookie = json;

	} else {
		if (value.user && value.pass) {
			value.user = value.pass = "";
			document.cookie = "{}";
		}

	}
});
