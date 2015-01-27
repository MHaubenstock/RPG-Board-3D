var serverController : ServerController;
var remoteIP : String = "192.168.1.2";
private var remotePort : int = 22354;

function Start()
{
	serverController = gameObject.Find("NetworkViewer").GetComponent(ServerController);
}

function OnGUI ()
{
	if(Network.peerType == NetworkPeerType.Disconnected)
	{
		if (GUI.Button (new Rect(10,50,100,30),"Start Server"))
		{
			// Creating server
			serverController.StartServer();
			PlayerPrefs.SetString("PlayerType", "DM");
		}
	
		// If not connected
		if (GUI.Button (new Rect(10,10,100,30),"Join Server as PC"))
		{
			// Connecting to the server
			serverController.connectToServer(remoteIP, remotePort);
			PlayerPrefs.SetString("PlayerType", "Player");
		}
		
		if(GUI.Button(Rect(10, 90, 100, 30), "Quit"))
			Application.Quit();
		
		// Fields to insert ip address and port
		remoteIP = GUI.TextField(new Rect(120,10,100,20),remoteIP);
		remotePort = parseInt(GUI.TextField(new Rect(230,10,40,20),remotePort.ToString()));
	}
	if(!(Network.peerType == NetworkPeerType.Disconnected))
	{
		if(!Network.isServer)
			return;
	
		GUILayout.BeginArea(Rect(0, 200, Screen.width, 35));
		GUILayout.BeginHorizontal();

		if(GUILayout.Button("Load World"))
		{
			serverController.loadLevel("MainScene");
		}
		
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
	}
}

