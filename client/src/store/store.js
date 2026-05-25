import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

// Import your slices
import authReducer from "./slices/authSlice";
import patentReducer from "./slices/patentSlice";

// ----------------------------------------------------------------------
// FIX: Native Storage Wrapper (Bypasses the Vite/Redux-Persist import bug)
// ----------------------------------------------------------------------
const customStorage = {
  getItem: (key) => {
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem: (key, value) => {
    return Promise.resolve(window.localStorage.setItem(key, value));
  },
  removeItem: (key) => {
    return Promise.resolve(window.localStorage.removeItem(key));
  },
};
// ----------------------------------------------------------------------

const persistConfig = {
  key: "root",
  version: 1,
  storage: customStorage, // <-- Using the custom storage here
  whitelist: ["auth"], // We only want to persist the user's login state
};

const rootReducer = combineReducers({
  auth: authReducer,
  patent: patentReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
