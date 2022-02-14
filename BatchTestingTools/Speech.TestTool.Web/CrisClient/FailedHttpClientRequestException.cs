using System;
using System.Net;
using System.Runtime.Serialization;

namespace Speech.TestTool.Web.CrisClient
{
    [Serializable]
    public sealed class FailedHttpClientRequestException : Exception
    {
        public FailedHttpClientRequestException()
        {
            this.StatusCode = HttpStatusCode.Unused;
        }

        public FailedHttpClientRequestException(string message)
            : base(message)
        {
            this.StatusCode = HttpStatusCode.Unused;
        }

        public FailedHttpClientRequestException(string message, Exception exception)
            : base(message, exception)
        {
            this.StatusCode = HttpStatusCode.Unused;
        }

        public FailedHttpClientRequestException(HttpStatusCode status, string reasonPhrase)
            : base(reasonPhrase)
        {
            this.StatusCode = status;
        }

        private FailedHttpClientRequestException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        {
            this.StatusCode = (HttpStatusCode)info.GetValue(nameof(this.StatusCode), typeof(HttpStatusCode));
        }

        public HttpStatusCode StatusCode { get; private set; }

        public string ReasonPhrase => this.Message;

        /// <inheritdoc />
        public override void GetObjectData(SerializationInfo info, StreamingContext context)
        {
            if (info != null)
            {
                info.AddValue(nameof(this.StatusCode), this.StatusCode);
            }

            base.GetObjectData(info, context);
        }
    }
}
