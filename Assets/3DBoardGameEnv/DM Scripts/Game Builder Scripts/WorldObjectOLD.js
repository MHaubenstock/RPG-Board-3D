var otherMaterials : Material[];
var materialIndex : int = 0;
var options : Texture[];

var availableActions : ActionOption;

var actionFunction : Function;
private var wasShowingDial : boolean = false;
private var dialCursorPos : Vector2;
private var dialCenter : Vector2;

function Start()
{

}

function move()
{
	Debug.Log("Start move action");
}

function MenuOptionsGUI()
{
	GUILayout.BeginArea(Rect(0, 0, Screen.width, Screen.height));

	if(otherMaterials.length > 0)
		texturePicker();
	
	GUILayout.EndArea();
}

function defaultAction()
{
}

//function OnInstantiation()
function OnInstantiation(scale : Vector3)
{
	networkView.RPC("changeObject", RPCMode.AllBuffered, scale, materialIndex);
}

@RPC
function changeObject(scale : Vector3, matIndex : int)
{
	this.transform.localScale = scale;

	if(otherMaterials.length > 0)
	{
		materialIndex = matIndex;
	
		if(this.renderer && this.transform.tag != "IgnoreMatChange")
			this.renderer.material = otherMaterials[materialIndex];
		
		for(var rend : Renderer in GetComponentsInChildren(Renderer))
		{
			if(rend.transform.tag != "IgnoreMatChange")
				rend.material = otherMaterials[materialIndex];
		}
	}
	
	//this.enabled = false;
}

function texturePicker()
{
	var matTextures : Texture[] = new Texture[otherMaterials.length];
	
	for(var t : int = 0; t < matTextures.length; t++)
		matTextures[t] = otherMaterials[t].mainTexture;

	materialIndex = GUI.SelectionGrid(Rect(20, 20, 100, 50), materialIndex, matTextures, 4);
}