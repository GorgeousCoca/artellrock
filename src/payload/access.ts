import type { Access } from "payload";

/** Любой посетитель (публичный контент сайта). */
export const anyone: Access = () => true;

/** Только вошедший в админку пользователь. */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user);

/** Запрещено через REST/GraphQL (Local API на сервере обходит access). */
export const nobody: Access = () => false;
