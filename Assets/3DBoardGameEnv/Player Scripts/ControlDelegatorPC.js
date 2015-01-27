private var networkViewer : ServerController;

function Start()
{
	if(networkView.isMine)
	{
		this.GetComponent(PlayerCharacter).enabled = true;
		this.GetComponent(MouseLook).enabled = true;
		this.light.enabled = true;
		this.camera.enabled = true;
		
		ServerController.serverController.transform.gameObject.networkView.RPC("addPlayer", RPCMode.Server, this.gameObject.networkView.viewID, Network.player);
	}
	else
	{
		this.GetComponent(PlayerCharacter).enabled = false;
		this.GetComponent(MouseLook).enabled = false;
		this.light.enabled = false;
		this.camera.enabled = false;
	}
}