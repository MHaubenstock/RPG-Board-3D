using System;
using System.IO;
using System.Reflection;
using System.Collections.Generic;
using System.Text;
using System.Linq;
using ICSharpCode.SharpZipLib.Zip.Compression.Streams;
using SevenZipRadical;


public static class CompressionHelper
{
	
	/*
	public static void PrewarmFileCreator()
	{
		var f = File.CreateText("prewarm.cs");
		f.WriteLine("using System;");
		f.WriteLine("public static partial class PreWarm {");
		f.WriteLine(" public static string [] PrewarmNames = new string [] {");
		List<string> names = new List<string>();
		Prewarm(names, typeof(UnityEngine.Object).Assembly);
		Prewarm(names, typeof(System.Object).Assembly);
		var useNames = names.GroupBy(n=>n).OrderByDescending(n=>n.Count()).Select(n=>n.Key).Take(10000).ToList();
		foreach(var name in useNames)
		{
			f.WriteLine("      \"" + name + "\", ");
		}
		f.WriteLine("       \"END OF LIST\"");
		f.WriteLine("     };");
		f.WriteLine("}");
		f.Close();
		
	}
	
	static void Prewarm(List<string> names, Assembly assembly)
	{
		
		foreach(var type in assembly.GetTypes())
		{
			Prewarm(names, type.GetFields());
			Prewarm(names, type.GetProperties());
			
		}
	}
	
	static void Prewarm(List<string> names, IEnumerable<MemberInfo> members)
	{
		names.AddRange(members.Select(m=>m.Name));
	}
	*/
	
	
	public static string technique = "ZipStream";
	
	public static string Compress(byte[] data, ICodeProgress progress)
	{
		using(var m = new MemoryStream())
		{
			switch(technique)
			{
			case "ZipStream":
				
				var br = new BinaryWriter(m);
				var z = new DeflaterOutputStream(m);
				br.Write(data.Length);
				z.Write(data, 0, data.Length);
				z.Flush();
				z.Close();
				break;
			case "7Zip":
			default:
				return Convert.ToBase64String(SevenZipRadical.Compression.LZMA.SevenZipRadicalHelper.Compress(data, progress));
			}
			return technique + ":" + Convert.ToBase64String(m.GetBuffer());
		}
	}
	
	public static byte[] Decompress(string data, ICodeProgress progress)
	{
		byte[] output = null;
		if(data.StartsWith("ZipStream:"))
		{
			var m = new MemoryStream(Convert.FromBase64String(data.Substring(10)));
			var z = new InflaterInputStream(m);
			var br = new BinaryReader(m);
			var length = br.ReadInt32();
		    output = new byte[length];
			z.Read(output, 0, length);
			z.Close();
			m.Close();
			
		}
		else
		{
			return SevenZipRadical.Compression.LZMA.SevenZipRadicalHelper.Decompress(Convert.FromBase64String(data), progress);
		}
		return output;
	}
}

namespace SevenZipRadical.Compression.LZMA
{
    public static class SevenZipRadicalHelper
    {

       static int dictionary = 1 << 8;

      // static Int32 posStateBits = 2;
     // static  Int32 litContextBits = 3; // for normal files
        // UInt32 litContextBits = 0; // for 32-bit data
     // static  Int32 litPosBits = 0;
        // UInt32 litPosBits = 2; // for 32-bit data
    // static   Int32 algorithm = 2;
    // static    Int32 numFastBytes = 128;

     static   bool eos = false;





     static   CoderPropID[] propIDs = 
				{
					CoderPropID.DictionarySize,
					CoderPropID.PosStateBits,
					CoderPropID.LitContextBits,
					CoderPropID.LitPosBits,
					CoderPropID.Algorithm,
					CoderPropID.NumFastBytes,
					CoderPropID.MatchFinder,
					CoderPropID.EndMarker
				};

        // these are the default properties, keeping it simple for now:
     static   object[] properties = 
				{
					(Int32)(dictionary),
					(Int32)(2),
					(Int32)(3),
					(Int32)(0),
					(Int32)(2),
					(Int32)(128),
					"bt4",
					eos
				};


        public static byte[] Compress(byte[] inputBytes, ICodeProgress progress)
        {

            MemoryStream inStream = new MemoryStream(inputBytes);
            MemoryStream outStream = new MemoryStream();

            SevenZipRadical.Compression.LZMA.Encoder encoder = new SevenZipRadical.Compression.LZMA.Encoder();
            encoder.SetCoderProperties(propIDs, properties);
            encoder.WriteCoderProperties(outStream);
            long fileSize = dataProcessingSize = inStream.Length;
            for (int i = 0; i < 8; i++)
                outStream.WriteByte((Byte)(fileSize >> (8 * i)));
            encoder.Code(inStream, outStream, -1, -1, progress);
            return outStream.ToArray();
        }
		
		public static long dataProcessingSize;

        public static byte[] Decompress(byte[] inputBytes, ICodeProgress progress)
        {
            MemoryStream newInStream = new MemoryStream(inputBytes);

            SevenZipRadical.Compression.LZMA.Decoder decoder = new SevenZipRadical.Compression.LZMA.Decoder();
            
            newInStream.Seek(0, 0);
            MemoryStream newOutStream = new MemoryStream();

            byte[] properties2 = new byte[5];
            if (newInStream.Read(properties2, 0, 5) != 5)
                throw (new Exception("input .lzma is too short"));
            long outSize = 0;
            for (int i = 0; i < 8; i++)
            {
                int v = newInStream.ReadByte();
                if (v < 0)
                    throw (new Exception("Can't Read 1"));
                outSize |= ((long)(byte)v) << (8 * i);
            }
            decoder.SetDecoderProperties(properties2);

            long compressedSize = dataProcessingSize = newInStream.Length - newInStream.Position;
            decoder.Code(newInStream, newOutStream, compressedSize, outSize, progress);

            byte[] b = newOutStream.ToArray();

            return b;



        }


    }
}
