var centerScreen : Vector2 = Vector2(Screen.width / 2, Screen.height / 2);

var speed : int = 5;
var crosshair : Texture;
var radialBackground : Texture;
var cursor : Texture;
var moveIcon : Texture;

private var selectedPiece : GameObject;
private var activeWO : WorldObject;
private var transPiece : GameObject;
private var transPieceYRotation : int = 0;
private var tempMat : Material;
private var tempRenderer : Renderer;
private var showBasicStats : boolean = false;
private var showMoreStats : boolean = false;
static var inBuildMode : boolean = true;
static var mouseControlActive : boolean = true;
private var mouseLook : MouseLook;
private var statsWindowPos : Rect = Rect (20, 20, 300, 300);
private var loadGameWindowPos : Rect = Rect (500, 20, 300, 150);
private var objectOptionsPos : Rect = Rect (200, 200, 300, 300);
private var dialOptionsPos : Rect = Rect (centerScreen.x - (Screen.width * 0.3 / 4), centerScreen.y  - (Screen.width * 0.3 / 4), Screen.width * 0.3, Screen.width * 0.3);
private var undo : UndoOperation = new UndoOperation();
private var stats : Statistics;
private var leftClickHoldTimer : float = 0;
static var showDial : boolean = false;
private var selecting : boolean = false;
static var radialRect : Rect;
static var cursorRect : Rect;
static var optionSize : Vector2 = new Vector2(Screen.width * 0.02, Screen.width * 0.02);
static var initRadialMenu : boolean = false;
static var thisAction : boolean = false;

static var anchorPos : Vector3;

//CREATE LINE OF SIGHT TEST
//create prefab  for object that controls character placement

//use line renderer to show intended movement. once moving is selected each square highlighted
//puts an intended move line there. iff you highlight any previous square(Maybe just last square)
//it reverts back to that square

function Start()
{
	Screen.lockCursor = true;
	mouseLook = GetComponent(MouseLook);
	iTween.CameraFadeAdd();
	
	radialRect = new Rect((Screen.width / 2) - (radialBackground.width / 2), (Screen.height / 2) - (radialBackground.width / 2), radialBackground.width, radialBackground.width);
	cursorRect = new Rect((Screen.width / 2) - (cursor.width / 2), (Screen.height / 2) - (cursor.width / 2), cursor.width, cursor.width);
}

function Update()
{
	if(Input.GetKeyDown(KeyCode.Tab))
	{
		if(inBuildMode)
		{
			inBuildMode = false;
			BroadcastMessage("OnEnterMenuMode", SendMessageOptions.DontRequireReceiver);
		}
		else
		{
			inBuildMode = true;
			BroadcastMessage("OnEnterBuildMode", SendMessageOptions.DontRequireReceiver);
		}
	}
			
	if(inBuildMode)
	{
		//Controls camera movement
		var directionVector = new Vector3(Input.GetAxis("Horizontal"), 0, Input.GetAxis("Vertical"));
		
		if(Input.GetKey(KeyCode.LeftShift))
			directionVector *= 2;
	
		if(Input.GetKey(KeyCode.Space))
			transform.Translate(Vector3.up * speed * 2 * Time.deltaTime, Space.World);
		
		transform.Translate(directionVector * speed * Time.deltaTime);
		//
		
		//Controls block placement
		var ray = Camera.main.ScreenPointToRay(centerScreen);
		var hit : RaycastHit;
			
		/*Control Scheme:
		Left-Click - Select?
		Right-Click(Hold) - Show basic info
		Right-Click(Hold) + Left-Click - More info
		E - Use
		*/
		
		if(Physics.Raycast(ray, hit, 100))
		{
			//If holding right-click
			if(Input.GetMouseButton(1) && mouseControlActive)
			{
				stats = hit.transform.GetComponent(Statistics);
				
				if(stats)
				{
					showBasicStats = true;
					
					if(Input.GetMouseButton(0))
						showMoreStats = true;
					else
						showMoreStats = false;
				}
				else
				{
					showBasicStats = false;
					showMoreStats = false;
				}

				/*
				if(hit.transform.tag != "Terrain")
				{
					if(Input.GetMouseButtonDown(0))
					{
					}
				}
				else
				{
				}
				*/
			}
			//If not holding right-click
			else
			{
				var voxelPosition : Vector3 = getAnchorPosition(hit);
				setAnchorPos(voxelPosition);
				/*
				if(Input.GetMouseButtonDown(0))
				{
					//Left-Click activates object dragger. be careful about putting stuff here.
				}
				*/
				
				if(Input.GetMouseButton(0) && mouseControlActive)
				{
					selectedPiece = hit.transform.gameObject;
					activeWO = selectedPiece.GetComponent(WorldObject);
					
					if(selectedPiece.GetComponent(WorldObject))
					{
						//if holding left-click
						if(Time.time - leftClickHoldTimer > 0.5)
						{
							showDial = true;
							selecting = false;
							GetComponent(MouseLook).enabled = false;
						}
						//if just clicking leftClick
						else
						{
							selecting = true;
						}
					}
					else
					{
						leftClickHoldTimer = Time.time;
					}
				}
				else
				{
					leftClickHoldTimer = Time.time;
					showDial = false;
					selecting = false;
					selectedPiece = null;
				}
				
				if(Input.GetMouseButtonUp(0) && mouseControlActive)
				{
					if(WorldObject.actionFunction)
					{
						WorldObject.actionFunction();
						WorldObject.actionFunction = null;
					}
											
					if(!showDial)
						GetComponent(MouseLook).enabled = true;
				}
											
				if(stats)
				{
					showBasicStats = false;
					showMoreStats = false;
					stats = new Statistics();
				}
			}
			
			if(Input.GetMouseButtonUp(1) && mouseControlActive)
			{
				showBasicStats = false;
				showMoreStats = false;
				stats = new Statistics();
			}
			
			if(Input.GetKeyDown(KeyCode.E))
			{
				hit.transform.gameObject.BroadcastMessage("OnInteraction", SendMessageOptions.DontRequireReceiver);
			}	
		}
		//if ray not hitting anything
		else
		{
			if(stats)
			{
				showBasicStats = false;
				showMoreStats = false;
				stats = new Statistics();
			}
		}
		
		//
		
		//Miscellaneous button functions
		
		
		if(Input.GetKeyDown(KeyCode.R))
		{
			//rotate Players
		}
		
		if(Input.GetKeyDown(KeyCode.F))
		{
			gameObject.light.enabled = !gameObject.light.enabled;
		}
		
		/*
		if(Input.GetKeyDown(KeyCode.Z))
		{
			if(undo.log.length > 0)
				undo.performUndo();
		}
		*/
		//
	}
	//If in menu mode
	else
	{
		
	}
}

function OnGUI()
{
	if(inBuildMode)
	{
		if(showDial && selectedPiece)
			activeWO.showRadialMenu();
		else
			GUI.Label(Rect(centerScreen.x - 20, centerScreen.y - 20, 40, 40), crosshair);	
		
		GUILayout.BeginArea(Rect(0, 0, Screen.width / 2, 200));
		
		//objGridInt = GUILayout.SelectionGrid(objGridInt, objStrings, 6);
				
		if(showBasicStats)
			statsWindowPos = GUI.Window (0, statsWindowPos, DoBasicStatsWindow, "Character's Stats", new GUIStyle());
		
		GUILayout.EndArea();
	}
	else
	{
		//dmToolbarPos = GUI.Window (0, dmToolbarPos, DoToolbarWindow, "DM's Toolbar");
		//loadGameWindowPos = GUI.Window (1, loadGameWindowPos, DoLoadWindow, "Load World");
		
		/*
		if(selectedPiece.GetComponent(WorldObject))
			objectOptionsPos = GUI.Window (2, objectOptionsPos, DoOptionsWindow, objStrings[objGridInt] + " + Settings");
		*/
	}
	
	if(objGridInt != lastObjGridInt)
	{
	}
	
	lastObjGridInt = objGridInt;
}

@RPC
function applyAfterSpawnChanges(objectNetID : NetworkViewID, objectScale : Vector3)
{
	var go : GameObject = (NetworkView.Find(objectNetID)).transform.gameObject;
	
	if(x > 0 && y > 0 && z > 0)
	{
		go.transform.localScale = objectScale;
	}
	
	if(go.GetComponent(WorldObject))
	{
		//go.GetComponent(WorldObject).OnInstantiation();
		go.GetComponent(WorldObject).enabled = false;	
	}
}

@RPC
function destroyBlock(netID : NetworkViewID)
{
	Destroy((NetworkView.Find(netID)).transform.gameObject);
}

function setAnchorPos(pos : Vector3)
{
	anchorPos = pos;
}

static function getHitVoxel(hit : RaycastHit)
{
	return Vector3(Mathf.Round(hit.point.x + (Mathf.Sign(hit.point.x - hit.transform.position.x) * 0.01)), Mathf.Round(hit.point.y + (Mathf.Sign(hit.point.y - hit.transform.position.y) * 0.01)), Mathf.Round(hit.point.z + (Mathf.Sign(hit.point.z - hit.transform.position.z) * 0.01)));
}

function getAnchorPosition(hit : RaycastHit)
{
	var blockPosition : Vector3 = getHitVoxel(hit);//Vector3(Mathf.Round(hit.point.x + (Mathf.Sign(hit.point.x - hit.transform.position.x) * 0.01)), Mathf.Round(hit.point.y + (Mathf.Sign(hit.point.y - hit.transform.position.y) * 0.01)), Mathf.Round(hit.point.z + (Mathf.Sign(hit.point.z - hit.transform.position.z) * 0.01)));
	
	if(x > 0 && y > 0 && z > 0 && transPiece)
	{	
		var rotatedBy180 : boolean = Mathf.Floor(transPieceYRotation % 180) == 0;
	
		if(hit.point.y == (hit.transform.position.y + hit.transform.lossyScale.y / 2))
			blockPosition.y += (Mathf.Floor(y / 2) - (1 - (y % 2)));
			
		else if(hit.point.y == (hit.transform.position.y - hit.transform.lossyScale.y / 2))
			blockPosition.y += -(Mathf.Floor(y / 2));
			
		else
			blockPosition.y += (Mathf.Floor(y / 2) - (1 - (y % 2)));
		
		//not detecting side hit on stretched sides of objects
		
		switch(Mathf.Floor(transPieceYRotation) / 90)
		{
			case 0:
				//x+
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(x / 2));
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(z / 2));
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				else
				{
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				break;
			
			case 1:
				
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					blockPosition.z -= (Mathf.Floor(x / 2));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(z / 2));
					blockPosition.z -= (Mathf.Floor(x / 2));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(x / 2));
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				else
				{
					blockPosition.z -= (Mathf.Floor(x / 2));
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				break;
				
			case 2:
				
				//x+
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					//z+
					blockPosition.z += -(Mathf.Floor(z / 2));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(x / 2));
					//z+
					blockPosition.z += -(Mathf.Floor(z / 2));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					//+x
					blockPosition.x += -(Mathf.Floor(x / 2));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(z / 2));
					//+x
					blockPosition.x += -(Mathf.Floor(x / 2));
				}
				else
				{
					blockPosition.x += -(Mathf.Floor(x / 2));
					blockPosition.z += -(Mathf.Floor(z / 2));
				}
			
				break;
			
			case 3:
				
				//x+
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(z / 2));
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.x += -(Mathf.Floor(z / 2));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(x / 2));
					blockPosition.x += -(Mathf.Floor(z / 2));
				}
				else
				{
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.x += -(Mathf.Floor(z / 2));
				}
			
				break;
		}
		
		if(x % 2 == 0)
		{
			if(rotatedBy180)
				blockPosition.x += 0.5;
			else
				blockPosition.z += 0.5;
		}
		
		if(y % 2 == 0)
			blockPosition.y += 0.5;
			
		if(z % 2 == 0)
		{
			if(rotatedBy180)
				blockPosition.z += 0.5;
			else
				blockPosition.x += 0.5;
		}
	}
	
	return blockPosition;
}

function hitScale(hit : RaycastHit, axis : String)
{
	if(axis.ToLower() == "x")
	{
		if(Mathf.Floor(hit.transform.eulerAngles.y) % 180 == 0)
			return hit.transform.lossyScale.x / 2;
		else
			return hit.transform.lossyScale.z / 2;
	}
	else if(axis.ToLower() == "z")
	{
		if(Mathf.Floor(hit.transform.eulerAngles.y) % 180 == 0)
			return hit.transform.lossyScale.z / 2;
		else
		{
			return hit.transform.lossyScale.x / 2;
		}
	}

	return 0;
}

function roundToTenth(num : float)
{
	return Mathf.Round((num * 10) + 0.01) / 10;
}

function OnEnterBuildMode()
{
	Screen.lockCursor = true;
	mouseLook.enabled = true;
	
	iTween.CameraFadeTo(0, 0.4);
}

function OnEnterMenuMode()
{
	Screen.lockCursor = false;
	mouseLook.enabled = false;
	
	iTween.CameraFadeTo(0.2, 0.4);
}
/*
function showRadialMenu()
{
	GUI.Label(radialRect, radialBackground);
	var tet = Rect(0,0,10,10);
	tet.center = radialRect.center;
	GUI.Label(tet, cursor);
	
	//if just started showing dial
	if(!initRadialMenu)
	{
		cursorRect.center = Vector2((Screen.width / 2), (Screen.height / 2));
		initRadialMenu = true;
	}
	//if continuing showing dial
	else
	{
		var cursorMove : Vector2 = Vector2(Input.GetAxis("Mouse X") * 3, -Input.GetAxis("Mouse Y") * 3);
		
		cursorRect.center += cursorMove;
				
		if(Vector2.Distance(cursorRect.center, radialRect.center) > (radialRect.width / 2.2))
		{
			cursorRect.center = ((cursorRect.center - radialRect.center).normalized * (radialRect.width / 2.2)) + radialRect.center;
		}
		
		var avaliableOptions : String[] = activeWO.availableActions.getActions();
		//var optionTextures : Texture[] = selectedPiece.GetComponent(WorldObject).options;
		
		activeWO.actionFunction = null;
		
		//does not limit number of options
		for(var op : int; op < avaliableOptions.length; op++)
		{
			var radians = ((op * 45) * Mathf.PI) / 180;
			var optionRect : Rect = Rect(radialRect.center.x - (optionSize.x / 2) + Mathf.Cos(radians) * (radialRect.width / 3), radialRect.center.y - (optionSize.y / 2) + Mathf.Sin(radians) * (radialRect.width / 3), optionSize.x, optionSize.y);
			
			thisAction = false;
			
			if(optionRect.Contains(cursorRect.center))
			{
				var newOptionSize : Vector2 = optionSize * 1.5;
							
				optionRect = Rect(radialRect.center.x - (newOptionSize.x / 2) + Mathf.Cos(radians) * (radialRect.width / 3), radialRect.center.y - (newOptionSize.y / 2) + Mathf.Sin(radians) * (radialRect.width / 3), newOptionSize.x, newOptionSize.y);
				
				thisAction = true;
				activeWO.Invoke(avaliableOptions[op], 0);
			}
			
			var optionTexture : Texture;
			
			switch(avaliableOptions[op])
			{
				case "move":
					optionTexture = moveIcon;
						//still need to invoke the method
					if(thisAction)
						activeWO.actionFunction = activeWO.move;
					
					break;
			}
			
			GUI.Label(optionRect, optionTexture);
		}
		
		/*
		//Limits number of options
		if(optionTextures.length > 0)
		{
			for(var angle : float; angle < 360; angle += 30)
			{
				if((angle / 30) > optionTeextures.length)
					break;
								
				var radians = (angle * Mathf.PI) / 180;
				
				GUI.Label(Rect(radialRect.center.x + Mathf.Cos(radians) * (radialRect.width / 3), radialRect.center.y + Mathf.Sin(radians) * (radialRect.width / 3), 20, 20), optionTexture[angle / 30]);
			}
		}
		*
							
		GUI.Label(cursorRect, cursor);
	}
}
*/

private var x : int = 0;
private var y : int = 0;
private var z : int = 0;
private var xS : String = "";
private var yS : String = "";
private var zS : String = "";
private var objGridInt : int = 0;
private var lastObjGridInt : int = 0;
private var objStrings : String[] = ["Block", "Stairs", "Torch", "Door", "Treasure Chest", "Bust", "Table", "Half-Block", "Chair", "Curved Block"];

function DoToolbarWindow(windowID : int)
{
	xS = GUI.TextField (Rect (20, 20, 25, 20), xS, 2);
	GUI.Label(Rect(52, 20, 25, 20), "x");
	yS = GUI.TextField (Rect (70, 20, 25, 20), yS, 2);
	GUI.Label(Rect(102, 20, 25, 20), "x");
	zS = GUI.TextField (Rect (120, 20, 25, 20), zS, 2);

	if(xS != "" && yS != "" && zS != "")
	{
		try
		{
			x = parseInt(xS);
			y = parseInt(yS);
			z = parseInt(zS);
		}
		catch(e)
		{
			x = 0;
			y = 0;
			z = 0;
			GUI.Label(Rect(10, 60, 100, 25), "Must be 1-99!");
		}
	}
	
	objGridInt = GUI.SelectionGrid (Rect (25, 100, 200, 50), objGridInt, objStrings, 3);
	
	GUI.DragWindow (Rect (0,0,10000,10000));
}

function DoLoadWindow(windowID : int)
{
	GUILayout.BeginVertical(); 
    GUILayout.FlexibleSpace();
    
    GUILayout.Space(60);
    
    for(var sg in LevelSerializer.SavedGames[LevelSerializer.PlayerName])
    { 
		if(GUILayout.Button(sg.Caption))
		{ 
			sg.Load(); 
			Time.timeScale = 1;
		} 
	}
     
    GUILayout.FlexibleSpace();
    GUILayout.EndVertical();
    
	GUI.DragWindow (Rect (0,0,10000,10000));
}

function DoOptionsWindow(windowID : int)
{
	GUILayout.BeginVertical(); 
    GUILayout.FlexibleSpace();
    
    if(selectedPiece.GetComponent(WorldObject))
		selectedPiece.GetComponent(WorldObject).MenuOptionsGUI();
     
    GUILayout.FlexibleSpace();
    GUILayout.EndVertical();
    
	GUI.DragWindow (Rect (0,0,10000,10000));
}

function DoBasicStatsWindow(windowID : int)
{
	GUILayout.BeginVertical(); 
    GUILayout.FlexibleSpace();
    
    GUILayout.Label("Stats go here.");
    
    if(!showMoreStats)
    	stats.basicStatsGUI();
    else
    	stats.moreStatsGUI();
    
    GUILayout.FlexibleSpace();
    GUILayout.EndVertical();
    
	GUI.DragWindow (Rect (0,0,10000,10000));
}

@RPC
function undoAddObject(object : Transform, type : UndoOpType)
{
	undo.addObject(object.gameObject, type);
}
