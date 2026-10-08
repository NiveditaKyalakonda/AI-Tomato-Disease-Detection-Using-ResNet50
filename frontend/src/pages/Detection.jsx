import React, { useState } from "react";

function Detection() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleImage = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 70px)",
        padding: "60px 20px",
        background: "#f8faf8",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "auto",
          textAlign: "center",
        }}
      >
        <h1 style={{ color: "#1b5e20" }}>
          🌿 Tomato Disease Detection
        </h1>

        <p style={{ color: "#666", fontSize: "18px" }}>
          Upload a tomato leaf image for AI analysis.
        </p>

        {!preview && (
          <label
            style={{
              display: "block",
              padding: "60px 20px",
              marginTop: "30px",
              border: "2px dashed #81c784",
              borderRadius: "15px",
              background: "white",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "50px" }}>📷</div>

            <h3>Select Tomato Leaf Image</h3>

            <p style={{ color: "#777" }}>
              JPG, JPEG or PNG
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleImage}
              style={{ display: "none" }}
            />
          </label>
        )}

        {preview && (
          <div
            style={{
              marginTop: "30px",
              background: "white",
              padding: "25px",
              borderRadius: "15px",
              boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
            }}
          >
            <img
              src={preview}
              alt="Tomato leaf preview"
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                borderRadius: "10px",
              }}
            />

            <p style={{ marginTop: "15px" }}>
              Selected image: <strong>{image?.name}</strong>
            </p>

            <button
              onClick={removeImage}
              style={{
                padding: "12px 25px",
                border: "none",
                borderRadius: "8px",
                background: "#d32f2f",
                color: "white",
                cursor: "pointer",
                fontSize: "15px",
              }}
            >
              Remove Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Detection;