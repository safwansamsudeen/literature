<div class="holder">
  <div class="center-box">
    <form method="GET" action="/">
      <input
        name="room"
        type="text"
        class="form-control"
        placeholder="Room Number"
      />
      <button type="submit" class="btn btn-outline-success btn-block"
        >Join Room</button
      >
    </form>
  </div>
</div>

<style>
  .holder {
    height: 100vh;
    margin: 0;
    background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  }

  .center-box {
    margin: 0 auto;
    text-align: center;
    width: 100%;
    max-width: 600px;
    padding-top: 200px;
  }

  .form-control {
    height: 50px;
    font-size: 1.5rem;
    margin-bottom: 20px;
  }

  .btn {
    height: 50px;
    font-size: 1.5rem;
  }
</style>
