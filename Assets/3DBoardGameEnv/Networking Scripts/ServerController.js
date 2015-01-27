var remoteIP = "192.168.1.2";
private var remotePort = 22354;
private var listenPort = 22354;
var useNAT = true;
var yourIP = "";
var yourPort = "";
var disconnectedLevel : String = "MainMenu";
private var lastLevelPrefix = 0;
var serverMaster : NetworkPlayer;
var players : Array = new Array();
static var serverController : ServerController;

class Player
{
	var go : GameObject;
	var player : NetworkPlayer;
	
	function Player(thisGO : GameObject, thisNetPlayer : NetworkPlayer)
	{
		go = thisGO;
		player = thisNetPlayer;
	}
}

function Start()
{
	serverController = this;
	DontDestroyOnLoad(this);
	Application.runInBackground = true;
}

@RPC
function addPlayer(id : NetworkViewID, player : NetworkPlayer)
{
	players.Add(new Player(networkView.Find(id).transform.gameObject, player));
}

function StartServer()
{
	Network.InitializeServer(32, listenPort, useNAT);
}

function OnServerInitialized()
{
	if(Network.isServer)
		networkView.RPC("setServerMaster", RPCMode.AllBuffered, Network.player);
}

function connectToServer(thisRemoteIP : String, thisRemotePort : int)
{
	remoteIP = thisRemoteIP;
	remotePort = thisRemotePort;

	Network.Connect(remoteIP, remotePort);
}

@RPC
function setServerMaster(master : NetworkPlayer)
{
	serverMaster = master;
}

function loadLevel(level : String)
{
	//Network.RemoveRPCsInGroup(0);
	Network.RemoveRPCsInGroup(1);
	networkView.RPC("LoadLevel", RPCMode.AllBuffered, level, lastLevelPrefix + 1);
}

//called on client
function OnConnectedToServer ()
{
	/*
	// Notify our objects that the level and the network are ready
	for (var go : GameObject in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedPlayer", SendMessageOptions.DontRequireReceiver);
	*/
}

function OnPlayerConnected(player: NetworkPlayer)
{
	
}

function OnPlayerDisconnected (player : NetworkPlayer)
{
	for(p in players)
		if(p.player == player)
			networkView.RPC("destroyPlayer", RPCMode.AllBuffered, p.go.networkView.viewID);
			
	//Network.RemoveRPCs(player, 0);
	//Network.RemoveRPCs(player, 1);
	//Network.RemoveRPCs(player, 2);
	//Network.DestroyPlayerObjects(player);
}

@RPC
function destroyPlayer(playerGOID : NetworkViewID)
{
	Destroy(networkView.Find(playerGOID).transform.gameObject);
}

@RPC
function LoadLevel (level : String, levelPrefix : int)
{
	lastLevelPrefix = levelPrefix;

	// There is no reason to send any more data over the network on the default channel,
	// because we are about to load the level, thus all those objects will get deleted anyway
	Network.SetSendingEnabled(1, false);	

	// We need to stop receiving because first the level must be loaded first.
	// Once the level is loaded, rpc's and other state update attached to objects in the level are allowed to fire
	Network.isMessageQueueRunning = false;

	// All network views loaded from a level will get a prefix into their NetworkViewID.
	// This will prevent old updates from clients leaking into a newly created scene.
	Network.SetLevelPrefix(levelPrefix);
	Application.LoadLevel(level);
	yield;
	yield;

	// Allow receiving data again
	Network.isMessageQueueRunning = true;
	// Now the level has been loaded and we can start sending out data to clients
	Network.SetSendingEnabled(1, true);


	for (var go in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedLevel", SendMessageOptions.DontRequireReceiver);	
}

function OnGUI()
{
	if(!(Network.peerType == NetworkPeerType.Disconnected))
	{
		GUILayout.BeginArea(Rect(Screen.width * 0.70, 20, Screen.width * 0.30, Screen.height * 0.10));
		GUILayout.BeginHorizontal();
		
		if(Network.isServer)
		{
			GUILayout.Label(Network.player.ipAddress);
		}
		else
		{
		
		}
		
		if(GUILayout.Button("Disconnect"))
		{
			WorldBuilder.inBuildMode = true;
			
			Network.Disconnect(100);
		}
		
		
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
	}
}

function OnDisconnectedFromServer()
{
	Application.LoadLevel("MainMenu");
}

@script RequireComponent(NetworkView)