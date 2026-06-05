import streamlit as st

st.title("Test App")
st.write("If you can see this, Streamlit is working!")
st.write("Current time:", st.session_state.get("time", "Not set"))

if st.button("Click me"):
    st.success("Button clicked!")
