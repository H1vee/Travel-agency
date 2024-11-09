import './Footer.scss'
export const Footer =() =>{
    return(
      <footer className='Footer'>
          <div className='Footer-Container'>
              <div className='Footer-row'>
                  <div className='Footer-col'>
                        <h4>Company</h4>
                        <ul className='Footer-ListProp'>
                          <li><a href="#">About Us</a></li>
                          <li><a href="#">Our Services</a></li>
                          <li><a href="#">Privacy Policy</a></li>
                        </ul>
                  </div>
                  <div className='Footer-col'>
                      <h4>Get Help</h4>
                      <ul className='Footer-ListProp'>
                          <li><a href="#">FAQ</a></li>
                          <li><a href="#">Order Status</a></li>
                          <li><a href="#">Payment Option</a></li>
                        </ul>
                  </div>
              </div>
          </div>
      </footer>
    );
};