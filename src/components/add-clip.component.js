import React, { Component } from "react";
import ClipsDataService from "../services/clip.service";
import firebase from "firebase/compat/app";
import "firebase/compat/storage";
import "../styles/addClip.css";

export const storage = firebase.storage();

export default class AddClip extends Component {
  constructor(props) {
    super(props);
    this.onChangeTitle = this.onChangeTitle.bind(this);
    this.onChangeDescription = this.onChangeDescription.bind(this);
    this.newClip = this.newClip.bind(this);

    this.state = {
      title: "",
      description: "",
      published: false,
      submitted: false,
      file: null,
      url: "",
      uploadProgress: 0 // estado para mostrar progreso de subida
    };
  }

  onChangeFile(e) {
    console.log(e.target.files[0]);
    this.setState({
      file: e.target.files[0],
    });
  }

  handleUpLoad(e, file) {
    e.preventDefault();
    const uploadTask = storage.ref('/clips/' + file.name).put(file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // actualizar el estado con el progreso
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        this.setState({
          uploadProgress: progress
        });
      },
      console.error,
      () => {
        storage
          .ref("clips")
          .child(file.name)
          .getDownloadURL()
          .then((myurl) => {
            this.setState({
              url: myurl
            }, () => {
              // si la URL se ha actualizado, guardar en la base de datos
              if (this.state.url !== "") {
                this.saveClip();
              }
            });
          });
      }
    );
  }

  saveClip() {
    this.setState({
      loading: true, // establecer loading en verdadero al iniciar la carga
      message: "" // borrar cualquier mensaje previo
    });

    let data = {
      title: this.state.title,
      description: this.state.description,
      published: false,
      url: this.state.url // asignar la URL al objeto 'data'
    };

    ClipsDataService.create(data)
      .then(() => {
        console.log("Created new item successfully!");
        this.setState({
          loading: false, // establecer loading en falso al completar la carga
          submitted: true,
          message: "The clip was uploaded successfully.",
          progress: 0 // restablecer la barra de progreso
        });
      })
      .catch((e) => {
        console.log(e);
      });
  }


  onChangeTitle(e) {
    this.setState({
      title: e.target.value,
    });
  }

  onChangeDescription(e) {
    this.setState({
      description: e.target.value,
    });
  }

  newClip() {
    this.setState({
      title: "",
      description: "",
      published: false,
      submitted: false,
      url: ""
    });
  }

  render() {
    return (
      <div className="submit">
        {this.state.submitted ? (
          <div>
            <h4>You submitted successfully!</h4>
            <button className="btn-success" onClick={this.newClip}>
              Add
            </button>
          </div>
        ) : (
          <div>
            <div className="form">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                className="form-title"
                id="title"
                required
                value={this.state.title}
                onChange={this.onChangeTitle}
                name="title"
              />
            </div>

            <div className="form">
              <label htmlFor="description">Description</label>
              <input
                type="text"
                className="form-description"
                id="description"
                required
                value={this.state.description}
                onChange={this.onChangeDescription}
                name="description"
              />
            </div>

            <div>
              <form
                onSubmit={(event) => {
                  this.handleUpLoad(event, this.state.file);
                }}
              >
                <input
                  type="file"
                  onChange={(event) => {
                    this.onChangeFile(event);
                  }}
                />
                <button disabled={!this.state.file}>Agregar</button>
              </form>
              {/* mostrar estado de carga */}
              {this.state.uploadProgress > 0 && (
                <div>Subiendo video: {this.state.uploadProgress}%</div>
              )}
              <img src={this.state.url} alt="" />
            </div>

          </div>
        )}
      </div>
    );
  }
}