import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import storyReducer from "@/features/story/storySlice";

export function makeStore() {
  return configureStore({ reducer: { story: storyReducer } });
}
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export const useAppDispatch = useDispatch.withTypes<AppStore["dispatch"]>();
export const useAppSelector = useSelector.withTypes<RootState>();
