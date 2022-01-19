using Newtonsoft.Json;
using Speech.TestTool.Web.CrisClient;
using System;
using System.Collections.Generic;

public class Links
{
    public string evaluations { get; set; }
    public string datasets { get; set; }
    public string models { get; set; }
    public string endpoints { get; set; }
    public string transcriptions { get; set; }
}

public class Properties
{
    public int datasetCount { get; set; }
    public int evaluationCount { get; set; }
    public int modelCount { get; set; }
    public int transcriptionCount { get; set; }
    public int endpointCount { get; set; }
}

public class Project
{
    public string self { get; set; }
    public Links links { get; set; }
    public Properties properties { get; set; }
    public DateTime createdDateTime { get; set; }
    public string locale { get; set; }
    public string displayName { get; set; }
    public List<ModelV3> Models { get; set; }
}

public class ProjectsV3
{
    [JsonProperty("values")]
    public List<Project> Projects { get; set; }

    [JsonProperty("@nextLink")]
    public string NextLink { get; set; }
}

