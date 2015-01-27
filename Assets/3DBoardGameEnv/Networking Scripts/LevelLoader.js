var supportedNetworkLevels : String[] = [ "MainScene" ];
var disconnectedLevel : String = "MainMenu";
private var lastLevelPrefix = 0;

function Awake ()
{
    // Network level loading is done in a separate channel.
    DontDestroyOnLoad(this);
    networkView.group = 1;
}

function OnGUI ()
{
	if(!(Network.peerType == NetworkPeerType.Disconnected))
	{
		GUILayout.BeginArea(Rect(0, 200, Screen.width, 35));
		GUILayout.BeginHorizontal();

		if(GUILayout.Button("Load World"))
		{
			Network.RemoveRPCsInGroup(0);
			Network.RemoveRPCsInGroup(1);
			networkView.RPC( "LoadLevel", RPCMode.AllBuffered, "MainScene", lastLevelPrefix + 1);
		}

		/*
		for(var sg in LevelSerializer.SavedGames[LevelSerializer.PlayerName])
	    { 
			if(GUILayout.Button(sg.Caption))
			{ 
				var data : String[] = Split(sg.Data, 2000);
			
				Network.RemoveRPCsInGroup(0);
				Network.RemoveRPCsInGroup(1);
				//networkView.RPC( "LoadWorld", RPCMode.AllBuffered, data, lastLevelPrefix + 1);
				LevelSerializer.LoadSavedLevel(data[0] + data[1] + data[2]);
				Time.timeScale = 1;
			} 
		}
		*/
		/*
		for (var level in supportedNetworkLevels)
		{
			if (GUILayout.Button(level))
			{
				Network.RemoveRPCsInGroup(0);
				Network.RemoveRPCsInGroup(1);
				networkView.RPC( "LoadLevel", RPCMode.AllBuffered, level, lastLevelPrefix + 1);
			}
		}
		*/
		
		GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();
		GUILayout.EndArea();
	}
}

@RPC
function LoadWorld(worldData : String[], levelPrefix : int)
{
	var Data : String = "";
	
	Debug.Log(worldData.Length);
	for(var data : String in worldData)
	{
		
		Data += data;
	}

	Debug.Log(Data.Length);

	lastLevelPrefix = levelPrefix;

	// There is no reason to send any more data over the network on the default channel,
	// because we are about to load the level, thus all those objects will get deleted anyway
	Network.SetSendingEnabled(0, false);	

	// We need to stop receiving because first the level must be loaded first.
	// Once the level is loaded, rpc's and other state update attached to objects in the level are allowed to fire
	Network.isMessageQueueRunning = false;

	// All network views loaded from a level will get a prefix into their NetworkViewID.
	// This will prevent old updates from clients leaking into a newly created scene.
	Network.SetLevelPrefix(levelPrefix);
	LevelSerializer.LoadSavedLevel(Data);
	yield;
	yield;

	// Allow receiving data again
	Network.isMessageQueueRunning = true;
	// Now the level has been loaded and we can start sending out data to clients
	Network.SetSendingEnabled(0, true);


	for (var go in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedLevel", SendMessageOptions.DontRequireReceiver);	
}

@RPC
function LoadLevel (level : String, levelPrefix : int)
{
	lastLevelPrefix = levelPrefix;

	// There is no reason to send any more data over the network on the default channel,
	// because we are about to load the level, thus all those objects will get deleted anyway
	Network.SetSendingEnabled(0, false);	

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
	Network.SetSendingEnabled(0, true);


	for (var go in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedLevel", SendMessageOptions.DontRequireReceiver);	
}

/*
function OnServerInitialized()
{
	for (var go : GameObject in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedMaster", SendMessageOptions.DontRequireReceiver);
}
*/
/*
function OnConnectedToServer ()
{
// Notify our objects that the level and the network are ready
	for (var go : GameObject in FindObjectsOfType(GameObject))
		go.SendMessage("OnNetworkLoadedPlayer", SendMessageOptions.DontRequireReceiver);
}
*/

function OnDisconnectedFromServer ()
{
	Application.LoadLevel(disconnectedLevel);
}

function Split(text : String, charCount : int)
{
    if (text.length == 0)
        return new String[0];
        
    var arrayLength = Mathf.Ceil(text.length / (charCount * 1.0));

    var result = new String[arrayLength];
    
    for(var i = 0; i < arrayLength - 1; i++)
    {
       	result[i] = text.Substring(i * charCount, charCount);
    }
    
    result[arrayLength-1] = text.Substring((arrayLength-1) * charCount);  
    return result;
}

@script RequireComponent(NetworkView)