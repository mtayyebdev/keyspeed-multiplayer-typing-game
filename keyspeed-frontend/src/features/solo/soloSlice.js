import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentText: null,
  durationMs: 0,
  wpm: 0,
  accuracy: 100,
  errors: 0,
  isFinished: false,
  lastResult: null,
};

const soloSlice = createSlice({
  name: 'solo',
  initialState,
  reducers: {
    setCurrentText: (state, action) => {
      state.currentText = action.payload;
      state.isFinished = false;
      state.lastResult = null;
    },
    setSoloResult: (state, action) => {
      state.lastResult = action.payload;
      state.isFinished = true;
    },
    resetSolo: (state) => {
      state.isFinished = false;
      state.lastResult = null;
      state.durationMs = 0;
      state.wpm = 0;
      state.accuracy = 100;
      state.errors = 0;
    },
  },
});

export const { setCurrentText, setSoloResult, resetSolo } = soloSlice.actions;
export default soloSlice.reducer;

